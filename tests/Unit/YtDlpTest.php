<?php

use App\Exceptions\DownloadFailed;
use App\Sources\YtDlp;
use Illuminate\Support\Facades\Process;

it('passes --cookies when a cookies path is configured', function () {
    Process::fake([
        '*' => Process::result(output: json_encode([
            'title' => 'Test',
            'thumbnail' => null,
            'duration' => 10,
        ])),
    ]);

    $ytdlp = new YtDlp('yt-dlp', '/tmp/cookies.txt');
    $ytdlp->probe('https://youtu.be/dQw4w9WgXcQ');

    Process::assertRan(fn ($process) => $process->command === [
        'yt-dlp',
        '--no-playlist',
        '--no-warnings',
        '--cookies',
        '/tmp/cookies.txt',
        '--dump-json',
        'https://youtu.be/dQw4w9WgXcQ',
    ]);
});

it('omits --cookies when none are configured', function () {
    Process::fake([
        '*' => Process::result(output: json_encode([
            'title' => 'Test',
            'thumbnail' => null,
            'duration' => 10,
        ])),
    ]);

    $ytdlp = new YtDlp('yt-dlp');
    $ytdlp->probe('https://youtu.be/dQw4w9WgXcQ');

    Process::assertRan(fn ($process) => $process->command === [
        'yt-dlp',
        '--no-playlist',
        '--no-warnings',
        '--dump-json',
        'https://youtu.be/dQw4w9WgXcQ',
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
