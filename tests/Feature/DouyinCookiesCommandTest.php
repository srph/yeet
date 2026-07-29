<?php

use App\Services\DouyinCookies;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    $this->jarPath = sys_get_temp_dir().'/douyin-cookies-'.uniqid().'.txt';
    config(['services.ytdlp.douyin_cookies' => $this->jarPath]);
});

afterEach(function () {
    if (is_file($this->jarPath)) {
        unlink($this->jarPath);
    }
});

function fakeTtwid(string $value = 'abc123'): void
{
    Http::fake(['ttwid.bytedance.com/*' => Http::response('', 200, [
        'Set-Cookie' => "ttwid={$value}; Path=/; Domain=.bytedance.com",
    ])]);
}

it('mints a jar', function () {
    fakeTtwid();

    $this->artisan('ytdlp:douyin')->assertSuccessful();

    expect(file_get_contents($this->jarPath))->toContain('abc123');
});

it('leaves an existing jar alone', function () {
    fakeTtwid('replacement');
    file_put_contents($this->jarPath, "# Netscape HTTP Cookie File\n.douyin.com\tTRUE\t/\tTRUE\t1\tttwid\toriginal\n");

    $this->artisan('ytdlp:douyin')->assertSuccessful();

    expect(file_get_contents($this->jarPath))->toContain('original');
    Http::assertNothingSent();
});

it('replaces an existing jar with --force', function () {
    fakeTtwid('replacement');
    file_put_contents($this->jarPath, "# Netscape HTTP Cookie File\n.douyin.com\tTRUE\t/\tTRUE\t1\tttwid\toriginal\n");

    $this->artisan('ytdlp:douyin --force')->assertSuccessful();

    expect(file_get_contents($this->jarPath))->toContain('replacement');
});

it('fails when bytedance is unreachable', function () {
    Http::fake(['ttwid.bytedance.com/*' => Http::response('nope', 500)]);

    $this->artisan('ytdlp:douyin')->assertFailed();
});

it('still exits 0 under --graceful so composer setup survives', function () {
    Http::fake(['ttwid.bytedance.com/*' => Http::response('nope', 500)]);

    $this->artisan('ytdlp:douyin --graceful')->assertSuccessful();

    // Nothing written — Douyin downloads throw until someone reruns this.
    expect(app(DouyinCookies::class)->exists())->toBeFalse();
});
