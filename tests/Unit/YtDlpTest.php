<?php

use App\Exceptions\DownloadFailed;
use App\Sources\YtDlp;
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

it('passes --cookies when a cookies path is configured', function () {
    Process::fake([
        '*' => Process::result(output: fakeProbeJson()),
    ]);

    $ytdlp = new YtDlp('yt-dlp', '/tmp/cookies.txt');
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

    $ytdlp = new YtDlp('yt-dlp');
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

    $ytdlp = new YtDlp('yt-dlp');

    expect(fn () => $ytdlp->probe('https://youtu.be/dQw4w9WgXcQ'))
        ->toThrow(
            App\Exceptions\SourceUnavailable::class,
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

    $ytdlp = new YtDlp('yt-dlp');

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

    $ytdlp = new YtDlp('yt-dlp');

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

    $ytdlp = new YtDlp('yt-dlp');

    expect(fn () => $ytdlp->download('https://youtu.be/dQw4w9WgXcQ', 'mp4'))
        ->toThrow(DownloadFailed::class);

    Process::assertRan(fn ($process) => in_array('--max-filesize', $process->command, true)
        && in_array('209715200', $process->command, true));
});

it('rejects a downloaded file over the size limit', function () {
    config(['services.downloads.max_filesize_bytes' => 10]);

    Process::fake(function (Illuminate\Process\PendingProcess $process) {
        $command = $process->command;
        $o = array_search('-o', $command, true);
        $template = $command[$o + 1];
        $path = str_replace('%(ext)s', 'mp4', $template);
        file_put_contents($path, str_repeat('x', 20));

        return Process::result();
    });

    $ytdlp = new YtDlp('yt-dlp');

    expect(fn () => $ytdlp->download('https://youtu.be/dQw4w9WgXcQ', 'mp4'))
        ->toThrow(fn (DownloadFailed $e) => expect($e->getMessage())->toStartWith('File exceeds'));
});
