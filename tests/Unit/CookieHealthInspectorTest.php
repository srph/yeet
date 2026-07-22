<?php

use App\Services\CookieHealthInspector;
use App\Sources\YtDlp;

function writeCookieFile(string $contents): string
{
    $path = tempnam(sys_get_temp_dir(), 'yeet-cookies-');
    file_put_contents($path, $contents);

    return $path;
}

it('treats chrome UINT64_MAX expiry as a session cookie', function () {
    // Regression: (int) "18446744073709551615" → PHP_INT_MAX → Carbon throws
    // "Unexpected data found. Trailing data" during the dashboard healthcheck.
    $path = writeCookieFile(implode("\t", [
        '.youtube.com',
        'TRUE',
        '/',
        'TRUE',
        '18446744073709551615',
        '__Secure-3PSID',
        'redacted',
    ]).PHP_EOL);

    config(['services.ytdlp.cookies' => $path]);

    $this->mock(YtDlp::class, function ($m) {
        $m->shouldReceive('probe')->once()->andReturn([
            'title' => 'Never Gonna Give You Up',
            'thumbnail' => null,
            'duration' => 212.0,
        ]);
    });

    $result = app(CookieHealthInspector::class)->inspect();

    expect($result)
        ->session_cookie->toBe('__Secure-3PSID')
        ->session_expires_at->toBeNull()
        ->probe_title->toBe('Never Gonna Give You Up');

    unlink($path);
});

it('still reads normal unix expiries', function () {
    $path = writeCookieFile(implode("\t", [
        '.youtube.com',
        'TRUE',
        '/',
        'TRUE',
        '2000000000',
        '__Secure-3PSID',
        'redacted',
    ]).PHP_EOL);

    config(['services.ytdlp.cookies' => $path]);

    $this->mock(YtDlp::class, function ($m) {
        $m->shouldReceive('probe')->once()->andReturn([
            'title' => 'Never Gonna Give You Up',
            'thumbnail' => null,
            'duration' => 212.0,
        ]);
    });

    $result = app(CookieHealthInspector::class)->inspect();

    expect($result['session_expires_at']?->getTimestamp())->toBe(2_000_000_000);

    unlink($path);
});
