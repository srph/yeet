<?php

namespace App\Sources;

use App\Exceptions\DownloadFailed;
use App\Exceptions\SourceUnavailable;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Str;

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

        throw_unless($result->successful(), new SourceUnavailable(
            $this->unavailableMessage($result->errorOutput())
        ));

        $json = json_decode($result->output(), true, flags: JSON_THROW_ON_ERROR);

        // Metadata alone isn't enough — the queue job needs real A/V streams.
        throw_unless($this->hasDownloadableFormats($json), new SourceUnavailable(
            'YouTube isn\'t serving a downloadable stream for this video right now.'
        ));

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

        throw_unless($result->successful(), new DownloadFailed(
            trim($result->errorOutput()) ?: 'yt-dlp failed'
        ));

        $files = glob("{$dir}/media.*");

        throw_if(empty($files), new DownloadFailed('yt-dlp produced no file'));

        $path = $files[0];

        if (filesize($path) > $maxBytes) {
            @unlink($path);
            @rmdir($dir);

            $limitMb = (int) round($maxBytes / 1024 / 1024);

            throw new DownloadFailed("File exceeds the {$limitMb} MB limit");
        }

        return $path;
    }

    /**
     * Shared flags. YouTube datacenter IPs get bot-checked; a Netscape cookies
     * file from a logged-in browser is the supported workaround.
     *
     * @return list<string>
     */
    private function baseArgs(): array
    {
        $args = [
            $this->binary,
            '--no-playlist', // a playlist URL must not fan out
            '--no-warnings',
        ];

        if ($this->cookies) {
            $args[] = '--cookies';
            $args[] = $this->cookies;
        }

        return $args;
    }

    /**
     * Storyboards (mhtml/images) don't count — those are what YouTube leaves
     * behind when it refuses to serve media to a bot-checked IP.
     */
    private function hasDownloadableFormats(array $json): bool
    {
        foreach ($json['formats'] ?? [] as $format) {
            $vcodec = $format['vcodec'] ?? 'none';
            $acodec = $format['acodec'] ?? 'none';

            if ($vcodec !== 'none' || $acodec !== 'none') {
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
