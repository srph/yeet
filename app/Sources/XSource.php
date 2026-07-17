<?php

namespace App\Sources;

class XSource implements Source
{
    /** x.com/user/status/123, plus the legacy twitter.com host. */
    private const PATTERN = '~(?:twitter|x)\.com/[A-Za-z0-9_]+/status/(\d+)~';

    public function key(): string
    {
        return 'x';
    }

    public function extractId(string $url): ?string
    {
        return preg_match(self::PATTERN, $url, $m) ? $m[1] : null;
    }
}
