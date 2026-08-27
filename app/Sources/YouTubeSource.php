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

    public function __construct(
        /** Netscape jar from YTDLP_COOKIES; null is fine on IPs YouTube trusts. */
        private readonly ?string $cookies = null,
    ) {}

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

    /**
     * Which YouTube player clients yt-dlp may ask for stream URLs.
     *
     * Both edits to the default set are load-bearing, and neither works alone:
     *
     * -android_vr — its formats carry URLs, so probe() sees a downloadable
     *   video and the job proceeds, but fetching one now 403s: YouTube wants a
     *   PO token bound to the video id and we have no token provider. Because
     *   android_vr is first in yt-dlp's default order and its format ids
     *   collide with every other client's, it wins selection and poisons the
     *   download. Dropping it is what stops the 403.
     *
     * +web_embedded — with android_vr gone the remaining default client is
     *   web_safari, whose adaptive formats are SABR-only and arrive with no
     *   URL at all, so selection fails with "Requested format is not
     *   available". web_embedded is the one that still hands back real
     *   progressive URLs for the full format ladder.
     *
     * The failure is silent from probe()'s side — it only reads metadata, so
     * this surfaces as a 403 three attempts deep in the queue.
     */
    private const PLAYER_CLIENTS = 'default,-android_vr,web_embedded';

    /**
     * - --js-runtimes node: YouTube serves JS challenges; yt-dlp needs a
     *   runtime to solve them. Deno is yt-dlp's default, but we always have
     *   Node 22 on Forge/local, so force that.
     * - --remote-components ejs:github: the challenge solver scripts. Bundled
     *   in some yt-dlp installs, missing in others — fetch if needed.
     * - --extractor-args player_client: see PLAYER_CLIENTS above.
     * - --cookies: datacenter IPs still get bot-checked even with a runtime.
     *   See the README on exporting them.
     */
    public function ytdlpArgs(): array
    {
        return [
            '--js-runtimes', 'node',
            '--remote-components', 'ejs:github',
            '--extractor-args', 'youtube:player_client='.self::PLAYER_CLIENTS,
            ...$this->cookies ? ['--cookies', $this->cookies] : [],
        ];
    }
}
