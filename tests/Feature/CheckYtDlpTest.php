<?php

use App\Exceptions\SourceUnavailable;
use App\Sources\YtDlp;

function writeCookies(string $contents): string
{
    $path = tempnam(sys_get_temp_dir(), 'yeet-cookies-');
    file_put_contents($path, $contents);

    return $path;
}

function netscapeLine(
    string $domain,
    string $name,
    int $expiration = 2_000_000_000,
): string {
    // domain \t includeSubdomains \t path \t secure \t expiration \t name \t value
    return implode("\t", [$domain, 'TRUE', '/', 'TRUE', (string) $expiration, $name, 'redacted']).PHP_EOL;
}

it('fails when YTDLP_COOKIES is not set', function () {
    config(['services.ytdlp.cookies' => null]);

    test()->artisan('ytdlp:check')
        ->expectsOutputToContain('YTDLP_COOKIES is not set')
        ->assertFailed();
});

it('fails when the cookies file is missing', function () {
    config(['services.ytdlp.cookies' => '/tmp/yeet-does-not-exist-cookies.txt']);

    test()->artisan('ytdlp:check')
        ->expectsOutputToContain('does not exist')
        ->assertFailed();
});

it('lists youtube cookie names and expiries without printing values', function () {
    $path = writeCookies(
        "# Netscape HTTP Cookie File\n"
        .netscapeLine('.youtube.com', 'PREF', 0)
        .netscapeLine('.youtube.com', '__Secure-3PSID', 2_000_000_000)
        .netscapeLine('.youtube.com', 'GPS', 1_000_000_000) // expired
        .netscapeLine('.google.com', 'NID') // ignored
    );

    config(['services.ytdlp.cookies' => $path]);

    // expectsOutputToContain matches per doWrite/line — don't assert two
    // substrings that only appear together on the same line.
    test()->artisan('ytdlp:check')
        ->expectsOutputToContain('youtube cookies (3)')
        ->expectsOutputToContain('PREF')
        ->expectsOutputToContain('GPS             EXPIRED')
        ->expectsOutputToContain('cookie:  __Secure-3PSID')
        ->doesntExpectOutputToContain('redacted')
        ->assertSuccessful();

    unlink($path);
});

it('warns when no session SID cookie is present', function () {
    $path = writeCookies(
        netscapeLine('.youtube.com', 'VISITOR_INFO1_LIVE')
    );

    config(['services.ytdlp.cookies' => $path]);

    test()->artisan('ytdlp:check')
        ->expectsOutputToContain('no SID / __Secure-1PSID / __Secure-3PSID')
        ->assertSuccessful();

    unlink($path);
});

it('parses HttpOnly-prefixed rows', function () {
    $path = writeCookies(
        '#HttpOnly_.youtube.com	TRUE	/	TRUE	2000000000	__Secure-3PSID	redacted'.PHP_EOL
    );

    config(['services.ytdlp.cookies' => $path]);

    test()->artisan('ytdlp:check')
        ->expectsOutputToContain('youtube cookies (1)')
        ->expectsOutputToContain('__Secure-3PSID')
        ->assertSuccessful();

    unlink($path);
});

it('treats chrome UINT64_MAX expiry as session', function () {
    $path = writeCookies(
        '.youtube.com	TRUE	/	TRUE	18446744073709551615	__Secure-3PSID	redacted'.PHP_EOL
    );

    config(['services.ytdlp.cookies' => $path]);

    // formatExpiry(0) → "session"; overflow must not become year 292277026596.
    test()->artisan('ytdlp:check')
        ->expectsOutputToContain('__Secure-3PSID  session')
        ->doesntExpectOutputToContain('292277026596')
        ->assertSuccessful();

    unlink($path);
});

it('fails when the file has no youtube cookies', function () {
    $path = writeCookies(netscapeLine('.google.com', 'NID'));

    config(['services.ytdlp.cookies' => $path]);

    test()->artisan('ytdlp:check')
        ->expectsOutputToContain('No youtube.com cookies found')
        ->assertFailed();

    unlink($path);
});

it('live-probes when --probe is passed', function () {
    $path = writeCookies(
        netscapeLine('.youtube.com', '__Secure-3PSID')
    );

    config(['services.ytdlp.cookies' => $path]);

    $this->mock(YtDlp::class, function ($m) {
        $m->shouldReceive('probe')->once()->with('https://www.youtube.com/watch?v=dQw4w9WgXcQ')->andReturn([
            'title' => 'Never Gonna Give You Up',
            'thumbnail' => null,
            'duration' => 213.0,
        ]);
    });

    test()->artisan('ytdlp:check', ['--probe' => true])
        ->expectsOutputToContain('ok:       yes')
        ->expectsOutputToContain('Never Gonna Give You Up')
        ->assertSuccessful();

    unlink($path);
});

it('fails the command when --probe hits no_formats', function () {
    $path = writeCookies(
        netscapeLine('.youtube.com', '__Secure-3PSID')
    );

    config(['services.ytdlp.cookies' => $path]);

    $this->mock(YtDlp::class, function ($m) {
        $m->shouldReceive('probe')->once()->andThrow(new SourceUnavailable(
            'No downloadable stream is available for this video right now.'
        ));
    });

    test()->artisan('ytdlp:check', ['--probe' => true])
        ->expectsOutputToContain('ok: no')
        ->assertFailed();

    unlink($path);
});
