<?php

use App\Exceptions\DownloadFailed;
use App\Exceptions\SourceUnavailable;
use App\Jobs\ProcessDownload;
use App\Models\Download;
use App\Sources\YtDlp;
use Illuminate\Support\Facades\Storage;

// The job is tested against a faked disk and a faked YtDlp — real extraction
// and real S3 are covered by manual verification, not here.

it('probes then uploads the file and completes the row', function () {
    Storage::fake('s3');

    $tmp = tempnam(sys_get_temp_dir(), 'yeet').'.mp4';
    file_put_contents($tmp, 'fake video bytes');

    $this->mock(YtDlp::class, function ($m) use ($tmp) {
        $m->shouldReceive('probe')->once()->andReturn([
            'title' => 'Never Gonna Give You Up',
            'thumbnail' => 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
            'duration' => 213.0,
        ]);
        $m->shouldReceive('download')->once()->andReturn($tmp);
    });

    $download = Download::factory()->create([
        'source_title' => 'Untitled',
        'duration' => null,
    ]);

    (new ProcessDownload($download))->handle(app(YtDlp::class));

    $download->refresh();

    $key = config('services.storage.base_directory').'/youtube/dQw4w9WgXcQ.mp4';

    expect($download->status)->toBe('complete')
        ->and($download->source_title)->toBe('Never Gonna Give You Up')
        ->and($download->duration)->toBe(213)
        ->and($download->storage_key)->toBe($key)
        ->and($download->storage_file_name)->toBe('dQw4w9WgXcQ.mp4')
        ->and($download->expires_at)->not->toBeNull()
        ->and($download->fulfilled_at)->not->toBeNull();

    Storage::disk('s3')->assertExists($key);

    // The scratch file must not survive — disk on the box is finite, unlike
    // the serverless function this used to run in.
    expect(file_exists($tmp))->toBeFalse();
});

it('skips probe on retry when already processing', function () {
    Storage::fake('s3');

    $tmp = tempnam(sys_get_temp_dir(), 'yeet').'.mp4';
    file_put_contents($tmp, 'fake video bytes');

    $this->mock(YtDlp::class, function ($m) use ($tmp) {
        // Prior attempt already probed — status=processing is the skip signal.
        $m->shouldReceive('probe')->never();
        $m->shouldReceive('download')->once()->andReturn($tmp);
    });

    $download = Download::factory()->create([
        'status' => 'processing',
        'source_title' => 'Never Gonna Give You Up',
        'duration' => 213,
    ]);

    (new ProcessDownload($download))->handle(app(YtDlp::class));

    $download->refresh();

    expect($download->status)->toBe('complete')
        ->and($download->source_title)->toBe('Never Gonna Give You Up');
});

it('re-probes when a prior attempt died during probing', function () {
    Storage::fake('s3');

    $tmp = tempnam(sys_get_temp_dir(), 'yeet').'.mp4';
    file_put_contents($tmp, 'fake video bytes');

    $this->mock(YtDlp::class, function ($m) use ($tmp) {
        $m->shouldReceive('probe')->once()->andReturn([
            'title' => 'Recovered title',
            'thumbnail' => 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
            'duration' => 100.0,
        ]);
        $m->shouldReceive('download')->once()->andReturn($tmp);
    });

    $download = Download::factory()->create([
        'status' => 'probing',
        'source_title' => 'Untitled',
    ]);

    (new ProcessDownload($download))->handle(app(YtDlp::class));

    expect($download->refresh()->source_title)->toBe('Recovered title');
});

it('partitions the storage key by source', function () {
    Storage::fake('s3');

    $tmp = tempnam(sys_get_temp_dir(), 'yeet').'.mp4';
    file_put_contents($tmp, 'fake video bytes');

    $this->mock(YtDlp::class, function ($m) use ($tmp) {
        $m->shouldReceive('probe')->andReturn([
            'title' => 'A post',
            'thumbnail' => null,
            'duration' => null,
        ]);
        $m->shouldReceive('download')->andReturn($tmp);
    });

    $download = Download::factory()->create([
        'source' => 'x',
        'source_id' => '1732824684683784516',
    ]);

    (new ProcessDownload($download))->handle(app(YtDlp::class));

    Storage::disk('s3')->assertExists(
        config('services.storage.base_directory').'/x/1732824684683784516.mp4',
    );
});

it('fails without downloading when probe finds no streams', function () {
    // Used to be a 422 on POST. Probe moved into the job so the HTTP path
    // stays fast; bot-checked / private videos fail here instead.
    $this->mock(YtDlp::class, function ($m) {
        $m->shouldReceive('probe')->once()->andThrow(new SourceUnavailable(
            'No downloadable stream is available for this video right now.'
        ));
        $m->shouldReceive('download')->never();
    });

    $download = Download::factory()->create(['source_title' => 'Untitled']);

    (new ProcessDownload($download))->handle(app(YtDlp::class));

    $download->refresh();

    expect($download->status)->toBe('failed')
        ->and($download->reason)->toBe(
            'No downloadable stream is available for this video right now.'
        )
        ->and($download->fulfilled_at)->not->toBeNull();
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
        ->and($download->reason)->toBe('video is private')
        ->and($download->fulfilled_at)->not->toBeNull();
});

it('presigns the download url on read rather than storing it', function () {
    Storage::fake('s3');
    Storage::disk('s3')->put('yeet/youtube/dQw4w9WgXcQ.mp4', 'bytes');

    $seenOptions = null;
    Storage::disk('s3')->buildTemporaryUrlsUsing(function ($path, $expiration, $options = []) use (&$seenOptions) {
        $seenOptions = $options;

        return 'https://example.test/'.$path.'?expiration='.$expiration->getTimestamp();
    });

    $download = Download::factory()->complete()->create();

    // The old app stored a presigned URL in the DB, so it started decaying the
    // moment it was written: a 1hr link against a 7-day expires_at.
    expect($download->download_url)->not->toBeNull();
    expect(array_key_exists('download_url', $download->getAttributes()))->toBeFalse();

    // Without attachment disposition, browsers open mp3/mp4 instead of saving.
    expect($seenOptions['ResponseContentDisposition'] ?? null)
        ->toContain('attachment')
        ->toContain('dQw4w9WgXcQ.mp4');
});

it('has no download url once the object is gone', function () {
    $download = Download::factory()->create(['status' => 'expired']);

    expect($download->download_url)->toBeNull();
});
