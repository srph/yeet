<?php

namespace App\Sources;

use App\Services\DouyinCookies;

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

    public function __construct(private readonly DouyinCookies $cookies) {}

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

    /**
     * Douyin's web API answers with an empty body unless a request carries all
     * three of a ttwid cookie, a browser User-Agent, and a douyin.com Referer.
     * Two out of three still fails, and yt-dlp reads the empty body as
     * "Fresh cookies (not necessarily logged in) are needed".
     *
     * jar() throws when the cookie hasn't been minted — see DouyinCookies.
     */
    public function ytdlpArgs(): array
    {
        return [
            '--user-agent', DouyinCookies::USER_AGENT,
            '--referer', DouyinCookies::REFERER,
            '--cookies', $this->cookies->jar(),
        ];
    }
}
