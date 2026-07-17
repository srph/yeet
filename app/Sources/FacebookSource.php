<?php

namespace App\Sources;

class FacebookSource implements Source
{
    /**
     * Facebook URL shapes are a mess. We match generously and let yt-dlp be
     * the real authority on whether it can actually pull the thing.
     */
    private const PATTERNS = [
        '~facebook\.com/[^/]+/videos/(\d+)~',
        '~facebook\.com/watch/?\?v=(\d+)~',
        '~facebook\.com/reel/(\d+)~',
        '~facebook\.com/share/[rv]/([A-Za-z0-9_-]+)~',
        '~fb\.watch/([A-Za-z0-9_-]+)~',
    ];

    public function key(): string
    {
        return 'facebook';
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
