<?php

namespace App\Sources;

use App\Exceptions\DownloadFailed;
use App\Exceptions\SourceUnavailable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Str;
use JsonException;

/**
 * Replaces youtubei.js. The same two calls work for every source, which is
 * the whole reason for picking yt-dlp — and it retires the PLAYER_ID that
 * had to be hand-updated whenever YouTube shipped a player change.
 */
class YtDlp
{
    public function __construct(
        private string $binary,
        private ?string $cookies = null,
    ) {}

    /**
     * Metadata probe — replaces `yt.getInfo(videoId)` from the old POST route.
     * --dump-json describes the media without downloading it.
     *
     * @return array{title: string, thumbnail: ?string, duration: ?float}
     */
    public function probe(string $url): array
    {
        $started = hrtime(true);
        $host = parse_url($url, PHP_URL_HOST) ?: 'unknown';

        // --ignore-no-formats-error: YouTube bot-checks often leave only
        // storyboard images. Without this, --dump-json still tries to pick a
        // downloadable format and dies with "Requested format is not available"
        // before we can read title/thumbnail — or tell the user why.
        $result = Process::timeout(30)->run([
            ...$this->baseArgs(),
            '--dump-json',
            '--ignore-no-formats-error',
            $url,
        ]);

        if (! $result->successful()) {
            Log::warning('ytdlp.probe.fail', [
                'url' => $url,
                'url_host' => $host,
                'reason' => 'process_failed',
                'exit' => $result->exitCode(),
                'stderr' => Str::limit(trim($result->errorOutput()), 500),
            ]);

            throw new SourceUnavailable(
                $this->unavailableMessage($result->errorOutput())
            );
        }

        try {
            $json = $this->decodeProbeJson($result->output());
        } catch (JsonException $e) {
            Log::warning('ytdlp.probe.fail', [
                'url' => $url,
                'url_host' => $host,
                'reason' => 'invalid_json',
                'message' => $e->getMessage(),
            ]);

            throw $e;
        }

        // Metadata alone isn't enough — the queue job needs real A/V streams.
        if (! $this->hasDownloadableFormats($json)) {
            Log::warning('ytdlp.probe.fail', [
                'url' => $url,
                'url_host' => $host,
                'reason' => 'no_formats',
                // yt-dlp still returns meta when only storyboards remain.
                'id' => $json['id'] ?? null,
                'extractor' => $json['extractor_key'] ?? $json['extractor'] ?? null,
                'title' => $json['title'] ?? null,
                'format_count' => count($json['formats'] ?? []),
            ]);

            throw new SourceUnavailable(
                'No downloadable stream is available for this video right now.'
            );
        }

        Log::info('ytdlp.probe.ok', [
            'url' => $url,
            'url_host' => $host,
            'id' => $json['id'] ?? null,
            'duration_ms' => (int) ((hrtime(true) - $started) / 1_000_000),
        ]);

        // Normalized across every source. `thumbnail` is often absent on X,
        // hence the nullable column.
        return [
            'title' => $json['title'] ?? 'Untitled',
            'thumbnail' => $json['thumbnail'] ?? null,
            'duration' => $json['duration'] ?? null,
        ];
    }

    /**
     * Downloads to a temp file and returns its path; the caller uploads and
     * unlinks. Writing to disk rather than buffering is what removes the old
     * app's Buffer.concat() memory ceiling — the file never has to fit in RAM.
     */
    public function download(string $url, string $format): string
    {
        $started = hrtime(true);
        $host = parse_url($url, PHP_URL_HOST) ?: 'unknown';

        $dir = storage_path('app/tmp/'.Str::ulid());
        mkdir($dir, 0755, true);

        $maxBytes = (int) config('services.downloads.max_filesize_bytes');

        $args = $format === 'mp3'
            // Audio-only: extract and transcode. Needs ffmpeg.
            ? ['-x', '--audio-format', 'mp3', '--audio-quality', '0']
            // Best video+audio, merged to mp4. Also needs ffmpeg, since
            // YouTube serves the two streams separately.
            : ['-f', 'bv*+ba/b', '--merge-output-format', 'mp4'];

        // Stays under ProcessDownload's $timeout of 3600.
        // --max-filesize aborts when yt-dlp knows the remote size; the
        // post-download check below covers unknown/merged sizes.
        $result = Process::timeout(3500)->run([
            ...$this->baseArgs(),
            ...$args,
            '--max-filesize', (string) $maxBytes,
            '-o', "{$dir}/media.%(ext)s", // yt-dlp fills in the real extension
            $url,
        ]);

        if (! $result->successful()) {
            $stderr = trim($result->errorOutput()) ?: 'yt-dlp failed';

            Log::error('ytdlp.download.fail', [
                'format' => $format,
                'exit' => $result->exitCode(),
                'stderr' => Str::limit($stderr, 500),
                'url_host' => $host,
            ]);

            throw new DownloadFailed($stderr);
        }

        $files = glob("{$dir}/media.*");

        if (empty($files)) {
            Log::error('ytdlp.download.fail', [
                'format' => $format,
                'exit' => $result->exitCode(),
                'stderr' => 'yt-dlp produced no file',
                'url_host' => $host,
            ]);

            throw new DownloadFailed('yt-dlp produced no file');
        }

        $path = $files[0];
        $bytes = filesize($path) ?: 0;

        if ($bytes > $maxBytes) {
            @unlink($path);
            @rmdir($dir);

            $limitMb = (int) round($maxBytes / 1024 / 1024);

            Log::error('ytdlp.download.fail', [
                'format' => $format,
                'stderr' => "File exceeds the {$limitMb} MB limit",
                'url_host' => $host,
                'bytes' => $bytes,
            ]);

            throw new DownloadFailed("File exceeds the {$limitMb} MB limit");
        }

        Log::info('ytdlp.download.ok', [
            'format' => $format,
            'bytes' => $bytes,
            'duration_ms' => (int) ((hrtime(true) - $started) / 1_000_000),
            'url_host' => $host,
        ]);

        return $path;
    }

    /**
     * Shared flags.
     *
     * - --js-runtimes node: YouTube serves JS challenges; yt-dlp needs a
     *   runtime to solve them. Deno is yt-dlp's default, but we always have
     *   Node 22 on Forge/local, so force that.
     * - --remote-components ejs:github: the challenge solver scripts. Bundled
     *   in some yt-dlp installs, missing in others — fetch if needed.
     * - --cookies: datacenter IPs still get bot-checked even with a runtime.
     *
     * @return list<string>
     */
    private function baseArgs(): array
    {
        $args = [
            $this->binary,
            '--no-playlist', // a playlist URL must not fan out
            // X quote/retweet posts with their own media still dump every
            // attached video as a playlist. Item 1 is the media on the URL
            // we were given (the quote/retweet), not the original.
            '--playlist-items', '1',
            '--no-warnings',
            '--js-runtimes', 'node',
            '--remote-components', 'ejs:github',
        ];

        if ($this->cookies) {
            $args[] = '--cookies';
            $args[] = $this->cookies;
        }

        return $args;
    }

    /**
     * Multi-video X posts dump one JSON object per line. Take the first —
     * that matches --playlist-items 1 (the media on the submitted URL).
     *
     * @return array<string, mixed>
     */
    private function decodeProbeJson(string $output): array
    {
        $line = trim(Str::before(ltrim($output), "\n"));

        return json_decode($line, true, flags: JSON_THROW_ON_ERROR);
    }

    /**
     * Storyboards (mhtml/images) don't count — those are what YouTube leaves
     * behind when it refuses to serve media to a bot-checked IP.
     *
     * Twitter GIFs often omit vcodec/acodec entirely but still set
     * video_ext to mp4 — treat that as downloadable too.
     */
    private function hasDownloadableFormats(array $json): bool
    {
        foreach ($json['formats'] ?? [] as $format) {
            $vcodec = $format['vcodec'] ?? null;
            $acodec = $format['acodec'] ?? null;

            if (($vcodec !== null && $vcodec !== 'none')
                || ($acodec !== null && $acodec !== 'none')) {
                return true;
            }

            $videoExt = $format['video_ext'] ?? 'none';
            $audioExt = $format['audio_ext'] ?? 'none';

            if ($videoExt !== 'none' || $audioExt !== 'none') {
                return true;
            }
        }

        return false;
    }

    /** Strip yt-dlp's ERROR: prefix into something the UI can show. */
    private function unavailableMessage(string $stderr): string
    {
        $message = trim($stderr);

        if ($message === '') {
            return 'Could not read that URL.';
        }

        // "ERROR: [youtube] id: Requested format is not available..."
        if (str_contains($message, 'Requested format is not available')
            || str_contains($message, 'Only images are available')) {
            return 'YouTube isn\'t serving a downloadable stream for this video right now.';
        }

        $message = preg_replace('/^ERROR:\s*/', '', $message) ?? $message;
        $message = preg_replace('/^\[[^\]]+\]\s*/', '', $message) ?? $message;

        // Drop leading "videoId: " when present.
        if (preg_match('/^\S+:\s+(.+)$/s', $message, $matches)) {
            $message = $matches[1];
        }

        return rtrim($message, '.');
    }
}
