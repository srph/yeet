<?php

use App\Exceptions\DownloadFailed;
use App\Jobs\ProcessDownload;
use App\Models\Download;
use App\Sources\YtDlp;
use Illuminate\Support\Facades\Storage;

// The job is tested against a faked disk and a faked YtDlp — real extraction
// and real S3 are covered by manual verification, not here.

it('uploads the file and completes the row', function () {
    Storage::fake('s3');

    $tmp = tempnam(sys_get_temp_dir(), 'yeet').'.mp4';
    file_put_contents($tmp, 'fake video bytes');

    $this->mock(YtDlp::class, fn ($m) => $m->shouldReceive('download')->once()->andReturn($tmp));

    $download = Download::factory()->create();

    (new ProcessDownload($download))->handle(app(YtDlp::class));

    $download->refresh();

    expect($download->status)->toBe('complete')
        ->and($download->storage_key)->toBe('yeet/youtube/dQw4w9WgXcQ.mp4')
        ->and($download->storage_file_name)->toBe('dQw4w9WgXcQ.mp4')
        ->and($download->expires_at)->not->toBeNull();

    Storage::disk('s3')->assertExists('yeet/youtube/dQw4w9WgXcQ.mp4');

    // The scratch file must not survive — disk on the box is finite, unlike
    // the serverless function this used to run in.
    expect(file_exists($tmp))->toBeFalse();
});

it('partitions the storage key by source', function () {
    Storage::fake('s3');

    $tmp = tempnam(sys_get_temp_dir(), 'yeet').'.mp4';
    file_put_contents($tmp, 'fake video bytes');

    $this->mock(YtDlp::class, fn ($m) => $m->shouldReceive('download')->andReturn($tmp));

    $download = Download::factory()->create([
        'source' => 'x',
        'source_id' => '1732824684683784516',
    ]);

    (new ProcessDownload($download))->handle(app(YtDlp::class));

    Storage::disk('s3')->assertExists('yeet/x/1732824684683784516.mp4');
});

it('is configured to raise on storage write failures', function () {
    // Guard against a real bug: Laravel defaults the s3 disk to
    // 'throw' => false, so a failed write returns false instead of raising.
    // handle() doesn't check putFileAs()'s return value, so with the default
    // a misconfigured or unreachable bucket marked the row 'complete' with a
    // storage_key pointing at nothing — the UI said "Dish is served" and the
    // download link was dead.
    //
    // Storage::fake() can't catch this (the fake always succeeds), so this
    // asserts the config directly.
    expect(config('filesystems.disks.s3.throw'))->toBeTrue();
});

it('records the reason when it fails', function () {
    $download = Download::factory()->create();

    (new ProcessDownload($download))->failed(new DownloadFailed('video is private'));

    $download->refresh();

    expect($download->status)->toBe('failed')
        ->and($download->reason)->toBe('video is private');
});

it('presigns the download url on read rather than storing it', function () {
    Storage::fake('s3');
    Storage::disk('s3')->put('yeet/youtube/dQw4w9WgXcQ.mp4', 'bytes');

    $download = Download::factory()->complete()->create();

    // The old app stored a presigned URL in the DB, so it started decaying the
    // moment it was written: a 1hr link against a 7-day expires_at.
    expect($download->download_url)->not->toBeNull();
    expect(array_key_exists('download_url', $download->getAttributes()))->toBeFalse();
});

it('has no download url once the object is gone', function () {
    $download = Download::factory()->create(['status' => 'expired']);

    expect($download->download_url)->toBeNull();
});
