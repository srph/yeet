<?php

namespace App\Console\Commands;

use App\Models\Download;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Throwable;

/**
 * Closes the "@TODO: CRON job to delete expired downloads" that sat in the
 * old app/page.tsx since day one. Nothing ever deleted objects, so the bucket
 * grew forever.
 *
 * This command is the ONLY reader of expires_at in the app.
 */
#[Signature('downloads:prune')]
#[Description('Delete expired download objects from storage and mark their rows expired')]
class PruneDownloads extends Command
{
    public function handle(): int
    {
        $expired = 0;
        $s3Deleted = 0;
        $s3Failed = 0;

        // Only 'complete' rows own an S3 object, so nothing else is prunable.
        // chunkById keeps memory flat if a backlog ever builds up.
        Download::query()
            ->where('status', 'complete')
            ->where('expires_at', '<', now())
            ->chunkById(100, function ($downloads) use (&$expired, &$s3Deleted, &$s3Failed) {
                foreach ($downloads as $download) {
                    $expired++;

                    try {
                        // delete() is idempotent — a missing object isn't an error,
                        // so a half-finished previous run recovers cleanly.
                        Storage::disk('s3')->delete($download->storage_key);
                        $s3Deleted++;
                    } catch (Throwable $e) {
                        $s3Failed++;

                        Log::error('downloads.prune.s3_fail', [
                            'id' => $download->id,
                            'key' => $download->storage_key,
                            'exception' => $e::class,
                            'message' => $e->getMessage(),
                        ]);

                        // Skip the tombstone — object may still be there.
                        continue;
                    }

                    // The row is kept as a tombstone rather than deleted: it's
                    // the record that this URL was once fetched, and the dedupe
                    // query skips it via whereNotIn(['failed','expired']).
                    $download->update([
                        'status' => 'expired',
                        'storage_key' => null,       // the object is gone; don't
                        'storage_file_name' => null, // pretend otherwise
                    ]);
                }
            });

        $scratchRemoved = $this->sweepScratchFiles();

        Log::info('downloads.prune', [
            'expired' => $expired,
            's3_deleted' => $s3Deleted,
            's3_failed' => $s3Failed,
            'scratch_removed' => $scratchRemoved,
        ]);

        $this->info("Pruned {$s3Deleted} expired download(s).");

        return self::SUCCESS;
    }

    /**
     * Sweep orphaned scratch dirs from jobs killed between download and unlink.
     * The job's finally block covers exceptions, but not a kill -9.
     */
    private function sweepScratchFiles(): int
    {
        $tmp = storage_path('app/tmp');
        $removed = 0;

        if (! File::isDirectory($tmp)) {
            return 0;
        }

        foreach (File::directories($tmp) as $dir) {
            if (File::lastModified($dir) < now()->subDay()->timestamp) {
                File::deleteDirectory($dir);
                $removed++;
            }
        }

        return $removed;
    }
}
