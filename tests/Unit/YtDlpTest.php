<?php

use App\Exceptions\DownloadFailed;
use App\Exceptions\SourceUnavailable;
use App\Services\DouyinCookies;
use App\Sources\DouyinSource;
use App\Sources\FacebookSource;
use App\Sources\SourceResolver;
use App\Sources\TikTokSource;
use App\Sources\XSource;
use App\Sources\YouTubeSource;
use App\Sources\YtDlp;
use Illuminate\Process\PendingProcess;
use Illuminate\Support\Facades\Process;

function fakeProbeJson(array $overrides = []): string
{
    return json_encode(array_merge([
        'title' => 'Test',
        'thumbnail' => null,
        'duration' => 10,
        // Real A/V — storyboards alone fail hasDownloadableFormats().
        'formats' => [
            [
                'format_id' => '140',
                'vcodec' => 'none',
                'acodec' => 'mp4a.40.2',
            ],
        ],
    ], $overrides));
}

/** A jar on disk, as `ytdlp:douyin` would leave it. */
function mintedDouyinJar(): string
{
    $path = tempnam(sys_get_temp_dir(), 'douyin');
    file_put_contents($path, "# Netscape HTTP Cookie File\n.douyin.com\tTRUE\t/\tTRUE\t99999999999\tttwid\tabc123\n");

    return $path;
}

/** The real registry, so tests exercise the same wiring the app does. */
function ytdlp(?string $youtubeCookies = null, string $douyinJar = '/tmp/no-douyin-jar.txt'): YtDlp
{
    return new YtDlp('yt-dlp', new SourceResolver([
        new YouTubeSource($youtubeCookies),
        new XSource,
        new FacebookSource,
        new TikTokSource,
        new DouyinSource(new DouyinCookies($douyinJar)),
    ]));
}

it('passes --cookies when a cookies path is configured', function () {
    Process::fake([
        '*' => Process::result(output: fakeProbeJson()),
    ]);

    $ytdlp = ytdlp('/tmp/cookies.txt');
    $ytdlp->probe('https://youtu.be/dQw4w9WgXcQ');

    Process::assertRan(fn ($process) => $process->command === [
        'yt-dlp',
        '--no-playlist',
        '--playlist-items',
        '1',
        '--no-warnings',
        '--js-runtimes',
        'node',
        '--remote-components',
        'ejs:github',
        '--cookies',
        '/tmp/cookies.txt',
        '--dump-json',
        '--ignore-no-formats-error',
        'https://youtu.be/dQw4w9WgXcQ',
    ]);
});

it('omits --cookies when none are configured', function () {
    Process::fake([
        '*' => Process::result(output: fakeProbeJson()),
    ]);

    $ytdlp = ytdlp();
    $ytdlp->probe('https://youtu.be/dQw4w9WgXcQ');

    Process::assertRan(fn ($process) => $process->command === [
        'yt-dlp',
        '--no-playlist',
        '--playlist-items',
        '1',
        '--no-warnings',
        '--js-runtimes',
        'node',
        '--remote-components',
        'ejs:github',
        '--dump-json',
        '--ignore-no-formats-error',
        'https://youtu.be/dQw4w9WgXcQ',
    ]);
});

it('sends a browser identity and the douyin jar for douyin urls', function () {
    Process::fake([
        '*' => Process::result(output: fakeProbeJson()),
    ]);

    $jar = mintedDouyinJar();

    $ytdlp = ytdlp('/tmp/youtube-cookies.txt', $jar);
    $ytdlp->probe('https://www.douyin.com/video/7641448788443270452');

    Process::assertRan(function ($process) use ($jar) {
        $command = $process->command;
        $cookies = array_search('--cookies', $command, true);

        return in_array('--user-agent', $command, true)
            && in_array(DouyinCookies::REFERER, $command, true)
            // The YouTube jar is the wrong domain — it must be replaced, not
            // appended to, or yt-dlp reads the last --cookies and wins nothing.
            && $command[$cookies + 1] === $jar
            && ! in_array('/tmp/youtube-cookies.txt', $command, true);
    });

    unlink($jar);
});

it('leaves non-douyin urls on the youtube jar with no referer', function () {
    Process::fake([
        '*' => Process::result(output: fakeProbeJson()),
    ]);

    $jar = mintedDouyinJar();

    $ytdlp = ytdlp('/tmp/youtube-cookies.txt', $jar);
    $ytdlp->probe('https://youtu.be/dQw4w9WgXcQ');

    Process::assertRan(fn ($process) => in_array('/tmp/youtube-cookies.txt', $process->command, true)
        && ! in_array('--referer', $process->command, true)
        && ! in_array($jar, $process->command, true));

    unlink($jar);
});

it('refuses douyin urls when the jar has not been minted', function () {
    Process::fake([
        '*' => Process::result(output: fakeProbeJson()),
    ]);

    $ytdlp = ytdlp(douyinJar: '/tmp/does-not-exist.txt');

    // Loud, and it names the command. Running without --cookies would fail
    // anyway, on a message that mentions neither cookies nor this app.
    expect(fn () => $ytdlp->probe('https://www.douyin.com/video/7641448788443270452'))
        ->toThrow(RuntimeException::class, 'php artisan ytdlp:douyin');

    Process::assertNothingRan();
});

it('gives a source with no quirks only the app-wide flags', function () {
    Process::fake([
        '*' => Process::result(output: fakeProbeJson()),
    ]);

    ytdlp('/tmp/youtube-cookies.txt')->probe('https://vm.tiktok.com/ZMR3abcXY/');

    // TikTok used to inherit YouTube's JS-challenge flags and cookie jar
    // purely because they lived in baseArgs(). Now nothing leaks across.
    Process::assertRan(fn ($process) => $process->command === [
        'yt-dlp',
        '--no-playlist',
        '--playlist-items',
        '1',
        '--no-warnings',
        '--dump-json',
        '--ignore-no-formats-error',
        'https://vm.tiktok.com/ZMR3abcXY/',
    ]);
});

it('rejects probe results that only have storyboard formats', function () {
    Process::fake([
        '*' => Process::result(output: fakeProbeJson([
            'formats' => [
                [
                    'format_id' => 'sb0',
                    'vcodec' => 'none',
                    'acodec' => 'none',
                ],
            ],
        ])),
    ]);

    $ytdlp = ytdlp();

    expect(fn () => $ytdlp->probe('https://youtu.be/dQw4w9WgXcQ'))
        ->toThrow(
            SourceUnavailable::class,
            'No downloadable stream is available for this video right now.',
        );
});

it('accepts twitter gif formats that omit codecs but set video_ext', function () {
    Process::fake([
        '*' => Process::result(output: fakeProbeJson([
            'title' => 'GIFs Out Of Context',
            'formats' => [
                [
                    'format_id' => 'http',
                    'ext' => 'mp4',
                    'video_ext' => 'mp4',
                    'audio_ext' => 'none',
                    // Twitter leaves these null on tweet_video GIFs.
                    'vcodec' => null,
                    'acodec' => null,
                ],
            ],
        ])),
    ]);

    $ytdlp = ytdlp();

    expect($ytdlp->probe('https://x.com/GIFOOC/status/2079837045657366748'))
        ->toMatchArray(['title' => 'GIFs Out Of Context']);
});

it('probes the first entry when yt-dlp dumps multi-video NDJSON', function () {
    $first = fakeProbeJson([
        'title' => 'Retweet video',
        'duration' => 10.4,
        'id' => '1',
    ]);
    $second = fakeProbeJson([
        'title' => 'Original video',
        'duration' => 26.0,
        'id' => '2',
    ]);

    Process::fake([
        '*' => Process::result(output: $first."\n".$second."\n"),
    ]);

    $ytdlp = ytdlp();

    expect($ytdlp->probe('https://x.com/PlipThePlop/status/2079759713407779142'))
        ->toMatchArray([
            'title' => 'Retweet video',
            'duration' => 10.4,
        ]);
});

it('passes --max-filesize on download', function () {
    config(['services.downloads.max_filesize_bytes' => 209715200]);

    Process::fake([
        '*' => Process::result(),
    ]);

    $ytdlp = ytdlp();

    expect(fn () => $ytdlp->download('https://youtu.be/dQw4w9WgXcQ', 'mp4'))
        ->toThrow(DownloadFailed::class);

    Process::assertRan(fn ($process) => in_array('--max-filesize', $process->command, true)
        && in_array('209715200', $process->command, true));
});

it('rejects a downloaded file over the size limit', function () {
    config(['services.downloads.max_filesize_bytes' => 10]);

    Process::fake(function (PendingProcess $process) {
        $command = $process->command;
        $o = array_search('-o', $command, true);
        $template = $command[$o + 1];
        $path = str_replace('%(ext)s', 'mp4', $template);
        file_put_contents($path, str_repeat('x', 20));

        return Process::result();
    });

    $ytdlp = ytdlp();

    expect(fn () => $ytdlp->download('https://youtu.be/dQw4w9WgXcQ', 'mp4'))
        ->toThrow(fn (DownloadFailed $e) => expect($e->getMessage())->toStartWith('File exceeds'));
});
