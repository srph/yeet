<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'ytdlp' => [
        // Absolute path: the queue worker daemon may not inherit a PATH
        // containing homebrew.
        'binary' => env('YTDLP_BINARY', 'yt-dlp'),
        // Netscape cookies.txt. YouTube bot-checks bare datacenter IPs;
        // export from a logged-in browser and point this at the file.
        'cookies' => env('YTDLP_COOKIES'),
    ],

    'downloads' => [
        // Hard cap on the produced file. yt-dlp gets --max-filesize; we also
        // reject after download in case format metadata lied or merge grew.
        'max_filesize_bytes' => (int) env('DOWNLOAD_MAX_FILESIZE_BYTES', 209715200), // 200 MiB
        // Named RateLimiter `downloads` on POST /api/download (per IP).
        'throttle_per_minute' => (int) env('DOWNLOAD_THROTTLE_PER_MINUTE', 10),
        'throttle_per_day' => (int) env('DOWNLOAD_THROTTLE_PER_DAY', 50),
    ],

    'storage' => [
        // Key prefix inside the bucket. Was AWS_BASE_DIRECTORY.
        'base_directory' => env('AWS_BASE_DIRECTORY', 'yeet'),
    ],

];
