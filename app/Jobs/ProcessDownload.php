<?php

namespace App\Jobs;

use App\Exceptions\SourceUnavailable;
use App\Models\Download;
use App\Sources\YtDlp;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Http\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Throwable;

class ProcessDownload implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    // DB_QUEUE_RETRY_AFTER must exceed this. At Laravel's default 90s the
    // queue reclaims a job mid-download and runs it a second time.
    public int $timeout = 3600;

    /** Seconds between attempts — mostly for transient network blips. */
    public function backoff(): array
    {
        return [1, 5, 10];
    }

    public function __construct(public Download $download) {}

    public function handle(YtDlp $ytdlp): void
    {
        $started = hrtime(true);
        $attempt = $this->attempts();

        // Serialized model can be stale across retries — status is the
        // "already probed?" signal (processing ⇒ skip probe).
        $this->download->refresh();

        Log::info('download.job.start', [
            'id' => $this->download->id,
            'attempt' => $attempt,
            'tries' => $this->tries,
            'status' => $this->download->status,
            'source' => $this->download->source,
            'format' => $this->download->format,
        ]);

        // Probe when we haven't finished it yet. Skip once status is
        // processing — that means a prior attempt already wrote meta and
        // failed later on download/upload.
        //
        // Both queued (first run) and probing (died mid-probe) need probe.
        if (in_array($this->download->status, ['queued', 'probing'], true)) {
            $this->download->update(['status' => 'probing']);

            try {
                $meta = $ytdlp->probe($this->download->source_url);
            } catch (SourceUnavailable $e) {
                // Permanent miss — don't burn the remaining $tries.
                $this->download->update([
                    'status' => 'failed',
                    'reason' => $e->getMessage(),
                    'fulfilled_at' => now(),
                ]);

                return;
            }

            $this->download->update([
                'source_title' => $meta['title'],
                'source_thumbnail' => $meta['thumbnail'] ?? $this->download->source_thumbnail,
                'duration' => isset($meta['duration']) ? (int) round($meta['duration']) : null,
                'status' => 'processing',
            ]);
        }

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

        $bytes = filesize($tmp) ?: 0;
        $contentType = $this->download->format === 'mp3'
            ? 'audio/mpeg'
            : 'video/mp4';

        try {
            Storage::disk('s3')->putFileAs(dirname($key), new File($tmp), basename($key), [
                'ContentType' => $contentType,
            ]);

            Log::info('storage.upload.ok', [
                'disk' => 's3',
                'key' => $key,
                'bytes' => $bytes,
                'content_type' => $contentType,
            ]);
        } catch (Throwable $e) {
            Log::error('storage.upload.fail', [
                'disk' => 's3',
                'key' => $key,
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);

            throw $e;
        } finally {
            // Never leave scratch files behind on the box.
            $dir = dirname($tmp);
            @unlink($tmp);
            @rmdir($dir);
        }

        // Store the KEY, not a presigned URL — links are minted fresh on read.
        $this->download->update([
            'status' => 'complete',
            'storage_key' => $key,
            'storage_file_name' => $fileName,
            'expires_at' => now()->addDays(7),
            'fulfilled_at' => now(),
        ]);

        Log::info('download.job.done', [
            'id' => $this->download->id,
            'attempt' => $attempt,
            'duration_ms' => (int) ((hrtime(true) - $started) / 1_000_000),
            'storage_key' => $key,
        ]);
    }

    /**
     * Fires only once all $tries are exhausted — so a row sits in
     * 'processing' for the whole retry window. SourceUnavailable is handled
     * inline in handle() (no retry).
     */
    public function failed(?Throwable $e): void
    {
        Log::error('download.job.fail', [
            'id' => $this->download->id,
            'attempt' => $this->attempts(),
            'exception' => $e ? $e::class : null,
            'message' => $e?->getMessage(),
        ]);

        $this->download->update([
            'status' => 'failed',
            'reason' => $e?->getMessage(),
            'fulfilled_at' => now(),
        ]);
    }
}
