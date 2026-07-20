<?php

namespace App\Models;

use Database\Factories\DownloadFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Throwable;

class Download extends Model
{
    /** @use HasFactory<DownloadFactory> */
    use HasFactory, HasUlids;

    protected $guarded = [];

    // status is the state machine:
    // queued → probing → processing → complete | failed,
    // then expired once downloads:prune deletes the object.
    // probing = yt-dlp metadata; also the retry skip signal (once processing,
    // re-runs don't probe again). There is no expired_at column — expiry is a
    // status. expires_at has exactly one reader: the prune command.

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'fulfilled_at' => 'datetime',
            // Without this the column comes back as a JSON string on some
            // drivers, and the frontend schema types it as a number.
            'duration' => 'integer',
        ];
    }

    // There's no API resource layer — the controller returns this model and
    // Eloquent serializes it, so what's below IS the API contract.

    // Durable S3 key — NOT a presigned URL. Links are minted per-read by
    // download_url below, so they're always fresh for a full hour.
    protected $hidden = ['storage_key'];

    // download_url isn't a column, so it needs appending to show up in JSON.
    protected $appends = ['download_url'];

    /**
     * Presign on read. Minted fresh on every serialization, so the link is
     * valid for an hour from *now* rather than an hour from whenever the job
     * happened to finish — which is what made the old app's links die ~6 days
     * before expires_at claimed they would.
     *
     * Null once prune clears storage_key: the object is gone, so there's
     * nothing honest to point at.
     */
    protected function downloadUrl(): Attribute
    {
        return Attribute::get(function () {
            if (! $this->storage_key) {
                return null;
            }

            try {
                return Storage::disk('s3')->temporaryUrl($this->storage_key, now()->addHour());
            } catch (Throwable $e) {
                Log::error('storage.presign.fail', [
                    'download_id' => $this->id,
                    'key' => $this->storage_key,
                    'exception' => $e::class,
                    'message' => $e->getMessage(),
                ]);

                throw $e;
            }
        });
    }
}
