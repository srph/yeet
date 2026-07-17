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
    public function __construct(private string $binary) {}

    /**
     * Metadata probe — replaces `yt.getInfo(videoId)` from the old POST route.
     * --dump-json describes the media without downloading it.
     *
     * @return array{title: string, thumbnail: ?string, duration: ?float}
     */
    public function probe(string $url): array
    {
        $result = Process::timeout(30)->run([
            $this->binary,
            '--dump-json',
            '--no-warnings',
            '--no-playlist', // a playlist URL must not fan out
            $url,
        ]);

        throw_unless($result->successful(), new SourceUnavailable(
            trim($result->errorOutput()) ?: 'yt-dlp could not read that URL'
        ));

        $json = json_decode($result->output(), true, flags: JSON_THROW_ON_ERROR);

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

        $args = $format === 'mp3'
            // Audio-only: extract and transcode. Needs ffmpeg.
            ? ['-x', '--audio-format', 'mp3', '--audio-quality', '0']
            // Best video+audio, merged to mp4. Also needs ffmpeg, since
            // YouTube serves the two streams separately.
            : ['-f', 'bv*+ba/b', '--merge-output-format', 'mp4'];

        // Stays under ProcessDownload's $timeout of 3600.
        $result = Process::timeout(3500)->run([
            $this->binary,
            '--no-playlist',
            '--no-warnings',
            ...$args,
            '-o', "{$dir}/media.%(ext)s", // yt-dlp fills in the real extension
            $url,
        ]);

        throw_unless($result->successful(), new DownloadFailed(
            trim($result->errorOutput()) ?: 'yt-dlp failed'
        ));

        $files = glob("{$dir}/media.*");

        throw_if(empty($files), new DownloadFailed('yt-dlp produced no file'));

        return $files[0];
    }
}
