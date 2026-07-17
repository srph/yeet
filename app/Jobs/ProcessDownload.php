<?php

namespace App\Jobs;

use App\Models\Download;
use App\Sources\YtDlp;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Http\File;
use Illuminate\Support\Facades\Storage;
use Throwable;

/**
 * Replaces the trigger.dev `download.youtube` task.
 *
 * The old task did all its DB writes in onStart/onSuccess/onFailure hooks and
 * none in run(). Laravel has no onStart/onSuccess, so those writes move inline;
 * onFailure maps onto failed().
 */
class ProcessDownload implements ShouldQueue
{
    use Queueable;

    // Mirrors trigger.config.ts: maxAttempts 3, maxDuration 3600.
    public int $tries = 3;

    public int $timeout = 3600;

    /**
     * trigger.dev used exponential backoff 1s -> 10s, factor 2, randomized.
     * Laravel takes plain seconds; these retries only really help against
     * transient network blips anyway.
     */
    public function backoff(): array
    {
        return [1, 5, 10];
    }

    public function __construct(public Download $download) {}

    public function handle(YtDlp $ytdlp): void
    {
        // Was trigger.dev's onStart hook. Fires per-attempt, same as before.
        $this->download->update(['status' => 'processing']);

        $fileName = "{$this->download->source_id}.{$this->download->format}";

        $key = sprintf(
            '%s/%s/%s',
            config('services.storage.base_directory'),
            $this->download->source, // partitioned by source, not one flat dir
            $fileName,
        );

        // yt-dlp writes straight to disk, so the file never has to fit in
        // memory — this is what removes the old Buffer.concat() ceiling.
        $tmp = $ytdlp->download(
            url: $this->download->source_url,
            format: $this->download->format,
        );

        try {
            Storage::disk('s3')->putFileAs(dirname($key), new File($tmp), basename($key), [
                'ContentType' => $this->download->format === 'mp3'
                    ? 'audio/mpeg'
                    : 'video/mp4',
            ]);
        } finally {
            // Never leave scratch files behind on the box.
            $dir = dirname($tmp);
            @unlink($tmp);
            @rmdir($dir);
        }

        // Was onSuccess. Note we store the KEY, not a presigned URL, so
        // expires_at is now truthful: the object really does live 7 days,
        // and each link is minted fresh on read.
        $this->download->update([
            'status' => 'complete',
            'storage_key' => $key,
            'storage_file_name' => $fileName,
            'expires_at' => now()->addDays(7),
        ]);
    }

    /**
     * Was onFailure. Like trigger.dev, this fires only once all $tries are
     * exhausted — so a row sits in 'processing' for the whole retry window.
     */
    public function failed(?Throwable $e): void
    {
        $this->download->update([
            'status' => 'failed',
            'reason' => $e?->getMessage(),
        ]);
    }
}
