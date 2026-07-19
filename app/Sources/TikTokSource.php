<?php

namespace App\Sources;

class TikTokSource implements Source
{
    /**
     * Full video URLs plus the short-link hosts yt-dlp's vm.tiktok extractor
     * follows. Short codes are used as source_id (like fb.watch) — we never
     * resolve them ourselves.
     */
    private const PATTERNS = [
        '~tiktok\.com/@[^/]+/video/(\d+)~',
        '~tiktok\.com/embed/(\d+)~',
        '~tiktok\.com/t/([A-Za-z0-9]+)~',
        '~vm\.tiktok\.com/([A-Za-z0-9]+)~',
        '~vt\.tiktok\.com/([A-Za-z0-9]+)~',
    ];

    public function key(): string
    {
        return 'tiktok';
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
