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
