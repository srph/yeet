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

it('reports youtube cookie names without printing values', function () {
    $path = writeCookies(
        "# Netscape HTTP Cookie File\n"
        .netscapeLine('.youtube.com', 'LOGIN_INFO')
        .netscapeLine('.youtube.com', 'SID')
        .netscapeLine('.youtube.com', '__Secure-1PSID')
        .netscapeLine('.youtube.com', 'SAPISID')
        .netscapeLine('.google.com', 'NID') // ignored
    );

    config(['services.ytdlp.cookies' => $path]);

    test()->artisan('ytdlp:check')
        ->expectsOutputToContain('count: 4')
        ->expectsOutputToContain('✓ LOGIN_INFO')
        ->expectsOutputToContain('✓ SID')
        ->expectsOutputToContain('✓ __Secure-1PSID')
        ->doesntExpectOutputToContain('redacted')
        ->assertSuccessful();

    unlink($path);
});

it('warns when typical session cookies are missing', function () {
    $path = writeCookies(
        netscapeLine('.youtube.com', 'VISITOR_INFO1_LIVE')
    );

    config(['services.ytdlp.cookies' => $path]);

    test()->artisan('ytdlp:check')
        ->expectsOutputToContain('Missing typical logged-in session cookies')
        ->expectsOutputToContain('✗ LOGIN_INFO')
        ->assertSuccessful();

    unlink($path);
});

it('parses HttpOnly-prefixed rows', function () {
    $path = writeCookies(
        '#HttpOnly_.youtube.com	TRUE	/	TRUE	2000000000	LOGIN_INFO	redacted'.PHP_EOL
        .netscapeLine('.youtube.com', '__Secure-3PSID')
    );

    config(['services.ytdlp.cookies' => $path]);

    test()->artisan('ytdlp:check')
        ->expectsOutputToContain('✓ LOGIN_INFO')
        ->expectsOutputToContain('✓ __Secure-3PSID')
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
        netscapeLine('.youtube.com', 'LOGIN_INFO')
        .netscapeLine('.youtube.com', 'SID')
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
        netscapeLine('.youtube.com', 'LOGIN_INFO')
        .netscapeLine('.youtube.com', 'SID')
    );

    config(['services.ytdlp.cookies' => $path]);

    $this->mock(YtDlp::class, function ($m) {
        $m->shouldReceive('probe')->once()->andThrow(new SourceUnavailable(
            'YouTube isn\'t serving a downloadable stream for this video right now.'
        ));
    });

    test()->artisan('ytdlp:check', ['--probe' => true])
        ->expectsOutputToContain('ok: no')
        ->assertFailed();

    unlink($path);
});
