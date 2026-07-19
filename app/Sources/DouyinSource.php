<?php

namespace App\Sources;

class DouyinSource implements Source
{
    /**
     * Canonical /video/{id} pages plus the v.douyin.com short links people
     * actually share. Short codes are the source_id — yt-dlp follows them.
     */
    private const PATTERNS = [
        '~douyin\.com/video/(\d+)~',
        '~v\.douyin\.com/([A-Za-z0-9]+)~',
    ];

    public function key(): string
    {
        return 'douyin';
    }

    public function extractId(string $url): ?string
    {
        foreach (self::PATTERNS as $pattern) {
            if (preg_match($pattern, $url, $m)) {
                return $m[1];
            }
        }

        return null;
    }
}
