<?php

namespace App\Services;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * The Douyin half of the cookie story. `YTDLP_COOKIES` is a youtube.com jar
 * and can't cover this: yt-dlp only sends cookies whose domain matches the
 * request host, so Douyin never sees them.
 *
 * Douyin's web API replies with an empty body and a slide-CAPTCHA header
 * unless a request carries all three of a `ttwid` cookie, a browser
 * User-Agent, and a douyin.com Referer. Two out of three still fails. yt-dlp
 * reports the empty body as "Fresh cookies (not necessarily logged in) are
 * needed" — its Douyin extractor has a TODO where the signature challenge
 * would go, so it can't solve this itself.
 *
 * The UA and Referer live in YtDlp. This class owns the cookie: `mint()`
 * writes the jar (that's `ytdlp:douyin`, run once per machine) and `jar()`
 * reads it back. Nothing mints on demand — a missing jar throws, because a
 * download that silently retries without cookies just fails later with a
 * message that points nowhere useful.
 */
class DouyinCookies
{
    /**
     * Douyin serves the CAPTCHA to yt-dlp's own User-Agent even when the
     * cookie is present, so YtDlp sends this instead.
     */
    public const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

    public const REFERER = 'https://www.douyin.com/';

    /**
     * ByteDance hands a ttwid to anyone who asks — it identifies a browser,
     * not a person, and no account is involved.
     */
    private const REGISTER_URL = 'https://ttwid.bytedance.com/ttwid/union/register/';

    /** Taken from a real register call; `aid`/`service` identify the caller. */
    private const REGISTER_BODY = [
        'region' => 'union',
        'aid' => 1768,
        'needFid' => false,
        'service' => 'www.ixigua.com',
        'migrate_info' => ['ticket' => '', 'source' => 'node'],
        'cbUrlProtocol' => 'https',
        'union' => true,
    ];

    public function __construct(private readonly string $path) {}

    /** Where the jar lives, whether or not it's been minted yet. */
    public function path(): string
    {
        return $this->path;
    }

    public function exists(): bool
    {
        return is_file($this->path) && is_readable($this->path);
    }

    public function modifiedAt(): ?Carbon
    {
        $mtime = $this->exists() ? filemtime($this->path) : false;

        return $mtime === false ? null : Carbon::createFromTimestampUTC($mtime);
    }

    /**
     * Path to a jar that's actually there, for handing to `yt-dlp --cookies`.
     * Throws rather than degrading: without it every Douyin download fails on
     * a message that doesn't mention cookies at all.
     */
    public function jar(): string
    {
        if (! $this->exists()) {
            throw new RuntimeException(
                "Douyin cookies are missing at {$this->path} — run `php artisan ytdlp:douyin`."
            );
        }

        return $this->path;
    }

    /**
     * Registers a fresh ttwid and writes the jar. Throws on failure so the
     * command can report why; nothing else calls this.
     */
    public function mint(): void
    {
        $response = Http::timeout(10)
            ->withHeaders(['User-Agent' => self::USER_AGENT])
            ->post(self::REGISTER_URL, self::REGISTER_BODY);

        $ttwid = $response->cookies()->getCookieByName('ttwid')?->getValue();

        if (! is_string($ttwid) || $ttwid === '') {
            throw new RuntimeException(
                "ByteDance returned no ttwid (HTTP {$response->status()})."
            );
        }

        $this->write($ttwid);
    }

    /** Cookie names in the jar. Never the values. */
    public function names(): array
    {
        if (! $this->exists()) {
            return [];
        }

        $names = [];

        foreach (file($this->path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
            if (str_starts_with($line, '#')) {
                continue;
            }

            $parts = explode("\t", $line);

            // domain flag path secure expiration name value
            if (count($parts) >= 7) {
                $names[] = $parts[5];
            }
        }

        return $names;
    }

    /**
     * Netscape cookies.txt. Written for `.douyin.com` even though ByteDance
     * sets ttwid on `.bytedance.com` — again, yt-dlp matches on request host.
     */
    private function write(string $ttwid): void
    {
        $directory = dirname($this->path);

        if (! is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        $expires = time() + 31536000;

        $contents = "# Netscape HTTP Cookie File\n"
            .implode("\t", ['.douyin.com', 'TRUE', '/', 'TRUE', (string) $expires, 'ttwid', $ttwid])
            ."\n";

        file_put_contents($this->path, $contents);
        chmod($this->path, 0600);
    }
}
