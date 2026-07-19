<?php

use App\Sources\DouyinSource;
use App\Sources\FacebookSource;
use App\Sources\SourceResolver;
use App\Sources\TikTokSource;
use App\Sources\XSource;
use App\Sources\YouTubeSource;

// The URL matchers are pure functions and they're where the multi-source
// promise actually lives, so they're worth testing hard.

beforeEach(function () {
    $this->resolver = new SourceResolver([
        new YouTubeSource,
        new XSource,
        new FacebookSource,
        new TikTokSource,
        new DouyinSource,
    ]);
});

dataset('youtube urls', [
    ['https://youtu.be/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/watch?list=RD&v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    // The old app rejected Shorts outright — none of its three regexes matched.
    ['https://www.youtube.com/shorts/tPEE9ZwTmy0', 'tPEE9ZwTmy0'],
]);

dataset('x urls', [
    ['https://x.com/SpaceX/status/1732824684683784516', '1732824684683784516'],
    // The legacy host has to keep working; plenty of links in the wild use it.
    ['https://twitter.com/SpaceX/status/1732824684683784516', '1732824684683784516'],
    ['https://x.com/some_user/status/123?s=20', '123'],
]);

dataset('facebook urls', [
    ['https://www.facebook.com/watch/?v=10153231379946729', '10153231379946729'],
    ['https://www.facebook.com/nasa/videos/1234567890', '1234567890'],
    ['https://www.facebook.com/reel/987654321', '987654321'],
    ['https://fb.watch/abc123XYZ/', 'abc123XYZ'],
]);

dataset('tiktok urls', [
    ['https://www.tiktok.com/@leenabhushan/video/6748451240264420610', '6748451240264420610'],
    ['https://www.tiktok.com/embed/6748451240264420610', '6748451240264420610'],
    ['https://www.tiktok.com/t/ZTRC5xgJp', 'ZTRC5xgJp'],
    ['https://vm.tiktok.com/ZMR3abcXY/', 'ZMR3abcXY'],
    ['https://vt.tiktok.com/ZSHxyz123/', 'ZSHxyz123'],
]);

dataset('douyin urls', [
    ['https://www.douyin.com/video/6961737553342991651', '6961737553342991651'],
    ['https://v.douyin.com/iJRxabcX/', 'iJRxabcX'],
]);

it('resolves youtube urls', function (string $url, string $id) {
    [$source, $extracted] = $this->resolver->resolve($url);
    expect($source->key())->toBe('youtube')->and($extracted)->toBe($id);
})->with('youtube urls');

it('resolves x urls', function (string $url, string $id) {
    [$source, $extracted] = $this->resolver->resolve($url);
    expect($source->key())->toBe('x')->and($extracted)->toBe($id);
})->with('x urls');

it('resolves facebook urls', function (string $url, string $id) {
    [$source, $extracted] = $this->resolver->resolve($url);
    expect($source->key())->toBe('facebook')->and($extracted)->toBe($id);
})->with('facebook urls');

it('resolves tiktok urls', function (string $url, string $id) {
    [$source, $extracted] = $this->resolver->resolve($url);
    expect($source->key())->toBe('tiktok')->and($extracted)->toBe($id);
})->with('tiktok urls');

it('resolves douyin urls', function (string $url, string $id) {
    [$source, $extracted] = $this->resolver->resolve($url);
    expect($source->key())->toBe('douyin')->and($extracted)->toBe($id);
})->with('douyin urls');

it('returns null for unsupported urls', function (string $url) {
    expect($this->resolver->resolve($url))->toBeNull();
})->with([
    'https://vimeo.com/12345',
    'https://example.com/video.mp4',
    'not a url at all',
    'https://youtube.com/',           // no id present
    'https://x.com/SpaceX',            // profile, not a status
    'https://www.tiktok.com/@leenabhushan', // profile, not a video
    'https://www.douyin.com/user/MS4wLjABAAAA', // profile, not a video
]);

it('does not let youtube claim another host\'s v= param', function () {
    // Regression. The old app's `[?&]v=` regex was not host-anchored, so a
    // Facebook watch link resolved as YouTube with the id truncated to its
    // first 11 chars ('10153231379'). Harmless when YouTube was the only
    // source; broken the moment Facebook exists.
    $youtube = new YouTubeSource;

    expect($youtube->extractId('https://www.facebook.com/watch/?v=10153231379946729'))
        ->toBeNull();
});

it('does not match an over-long id', function () {
    // YouTube ids are always exactly 11 chars; matching the first 11 of a
    // longer string would silently fetch the wrong video.
    $youtube = new YouTubeSource;

    expect($youtube->extractId('https://youtube.com/watch?v=dQw4w9WgXcQEXTRA'))
        ->toBeNull();
});
