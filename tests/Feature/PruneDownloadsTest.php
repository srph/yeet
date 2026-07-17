<?php

use App\Models\Download;
use Illuminate\Support\Facades\Storage;

it('deletes the object and tombstones the row', function () {
    Storage::fake('s3');
    Storage::disk('s3')->put('yeet/youtube/dQw4w9WgXcQ.mp4', 'bytes');

    $download = Download::factory()->expiring()->create();

    test()->artisan('downloads:prune')->assertSuccessful();

    $download->refresh();

    expect($download->status)->toBe('expired')
        ->and($download->storage_key)->toBeNull()
        ->and($download->storage_file_name)->toBeNull()
        ->and($download->download_url)->toBeNull();

    Storage::disk('s3')->assertMissing('yeet/youtube/dQw4w9WgXcQ.mp4');
});

it('leaves downloads that have not expired alone', function () {
    Storage::fake('s3');

    $download = Download::factory()->complete()->create(); // expires in 7 days

    test()->artisan('downloads:prune');

    expect($download->refresh()->status)->toBe('complete');
});

it('ignores rows that never had an object', function () {
    Storage::fake('s3');

    $queued = Download::factory()->create(['status' => 'queued']);
    $failed = Download::factory()->create(['status' => 'failed']);

    test()->artisan('downloads:prune')->assertSuccessful();

    expect($queued->refresh()->status)->toBe('queued')
        ->and($failed->refresh()->status)->toBe('failed');
});

it('lets a pruned url be downloaded again', function () {
    // The tombstone must not block a fresh request — otherwise a video is
    // permanently un-downloadable a week after anyone first fetched it.
    Storage::fake('s3');
    Storage::disk('s3')->put('yeet/youtube/dQw4w9WgXcQ.mp4', 'bytes');

    Download::factory()->expiring()->create();

    test()->artisan('downloads:prune');

    expect(
        Download::query()
            ->where('source', 'youtube')
            ->where('source_id', 'dQw4w9WgXcQ')
            ->where('format', 'mp4')
            ->whereNotIn('status', ['failed', 'expired'])
            ->exists()
    )->toBeFalse();
});
