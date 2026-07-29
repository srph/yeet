<?php

use App\Services\DouyinCookies;
use GuzzleHttp\Promise\PromiseInterface;
use Illuminate\Support\Facades\Http;

function douyinJarPath(): string
{
    return sys_get_temp_dir().'/douyin-cookies-'.uniqid().'.txt';
}

function ttwidResponse(string $value = 'abc123'): PromiseInterface
{
    return Http::response('', 200, [
        'Set-Cookie' => "ttwid={$value}; Path=/; Domain=.bytedance.com; Max-Age=31536000",
    ]);
}

it('mints a ttwid and writes a netscape jar for .douyin.com', function () {
    Http::fake(['ttwid.bytedance.com/*' => ttwidResponse()]);

    $path = douyinJarPath();
    (new DouyinCookies($path))->mint();

    // Tab-separated, .douyin.com — yt-dlp only sends cookies whose domain
    // matches the request host, so the .bytedance.com origin won't do.
    expect(file_get_contents($path))
        ->toContain(".douyin.com\tTRUE\t/\tTRUE\t")
        ->toContain("\tttwid\tabc123");

    unlink($path);
});

it('throws when bytedance returns no ttwid', function () {
    Http::fake(['ttwid.bytedance.com/*' => Http::response('nope', 500)]);

    $path = douyinJarPath();

    expect(fn () => (new DouyinCookies($path))->mint())
        ->toThrow(RuntimeException::class, 'HTTP 500');

    expect(file_exists($path))->toBeFalse();
});

it('hands back the jar path once minted', function () {
    Http::fake(['ttwid.bytedance.com/*' => ttwidResponse()]);

    $path = douyinJarPath();
    $cookies = new DouyinCookies($path);
    $cookies->mint();

    expect($cookies->jar())->toBe($path)
        ->and($cookies->exists())->toBeTrue()
        ->and($cookies->names())->toBe(['ttwid'])
        ->and($cookies->modifiedAt())->not->toBeNull();

    unlink($path);
});

it('points at the artisan command when the jar is missing', function () {
    $cookies = new DouyinCookies(douyinJarPath());

    expect($cookies->exists())->toBeFalse()
        ->and($cookies->names())->toBe([])
        ->and($cookies->modifiedAt())->toBeNull();

    expect(fn () => $cookies->jar())
        ->toThrow(RuntimeException::class, 'php artisan ytdlp:douyin');
});

it('never re-mints on its own', function () {
    Http::fake(['ttwid.bytedance.com/*' => ttwidResponse()]);

    $path = douyinJarPath();
    file_put_contents($path, "# Netscape HTTP Cookie File\n.douyin.com\tTRUE\t/\tTRUE\t1\tttwid\told\n");

    // Even a year-old jar is read as-is; refreshing is `ytdlp:douyin --force`.
    expect((new DouyinCookies($path))->jar())->toBe($path);

    Http::assertNothingSent();

    unlink($path);
});
