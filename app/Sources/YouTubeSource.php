<?php

namespace App\Sources;

class YouTubeSource implements Source
{
    /**
     * Ported from the three regexes in the old app/api/download/route.ts, with
     * two fixes:
     *
     * 1. /shorts/ is matched — the old patterns rejected Shorts outright.
     * 2. Every pattern is anchored to a YouTube host. The old `[?&]v=` pattern
     *    matched ANY url with a v= param, so a Facebook watch link
     *    (facebook.com/watch/?v=10153231379946729) resolved as YouTube with the
     *    id truncated to its first 11 chars. That was harmless while YouTube was
     *    the only source; it is not harmless now.
     *
     * The trailing boundary stops an over-long id from matching its first 11
     * characters — YouTube ids are always exactly 11.
     */
    private const BOUNDARY = '(?![a-zA-Z0-9_-])';

    private const PATTERNS = [
        '~youtu\.be/([a-zA-Z0-9_-]{11})'.self::BOUNDARY.'~',
        '~youtube\.com/watch\?(?:[^ ]*&)?v=([a-zA-Z0-9_-]{11})'.self::BOUNDARY.'~',
        '~youtube\.com/embed/([a-zA-Z0-9_-]{11})'.self::BOUNDARY.'~',
        '~youtube\.com/shorts/([a-zA-Z0-9_-]{11})'.self::BOUNDARY.'~',
    ];

    public function key(): string
    {
        return 'youtube';
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
