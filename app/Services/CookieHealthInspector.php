<?php

namespace App\Services;

use App\Sources\YtDlp;
use Illuminate\Support\Carbon;
use RuntimeException;

class CookieHealthInspector
{
    private const SESSION_COOKIES = ['__Secure-3PSID', '__Secure-1PSID', 'SID'];

    private const PROBE_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

    public function __construct(private readonly YtDlp $ytdlp) {}

    /**
     * @return array{
     *   cookie_count: int,
     *   session_cookie: string,
     *   session_expires_at: Carbon|null,
     *   probe_title: string
     * }
     */
    public function inspect(): array
    {
        $path = config('services.ytdlp.cookies');

        if (! is_string($path) || $path === '') {
            throw new RuntimeException('YTDLP_COOKIES is not configured.');
        }

        if (! is_file($path) || ! is_readable($path)) {
            throw new RuntimeException('The cookies file is missing or unreadable.');
        }

        $cookies = $this->parseNetscape($path);

        if ($cookies === []) {
            throw new RuntimeException('No YouTube cookies were found in the file.');
        }

        $session = collect(self::SESSION_COOKIES)
            ->map(fn (string $name) => collect($cookies)->firstWhere('name', $name))
            ->filter()
            ->first();

        if (! is_array($session)) {
            throw new RuntimeException('No active YouTube session cookie was found.');
        }

        $sessionExpiresAt = $session['expires'] > 0
            ? Carbon::createFromTimestampUTC($session['expires'])
            : null;

        if ($sessionExpiresAt?->isPast()) {
            throw new RuntimeException('The YouTube session cookie has expired.');
        }

        $probe = $this->ytdlp->probe(self::PROBE_URL);

        return [
            'cookie_count' => count($cookies),
            'session_cookie' => $session['name'],
            'session_expires_at' => $sessionExpiresAt,
            'probe_title' => (string) ($probe['title'] ?? 'Untitled'),
        ];
    }

    /**
     * @return array{file_modified_at: Carbon|null, cookie_file_fingerprint: string|null}
     */
    public function fileIdentity(): array
    {
        $path = config('services.ytdlp.cookies');

        if (! is_string($path) || ! is_file($path) || ! is_readable($path)) {
            return [
                'file_modified_at' => null,
                'cookie_file_fingerprint' => null,
            ];
        }

        $mtime = filemtime($path);
        $fingerprint = hash_hmac_file('sha256', $path, (string) config('app.key'));

        return [
            'file_modified_at' => $mtime ? Carbon::createFromTimestampUTC($mtime) : null,
            'cookie_file_fingerprint' => $fingerprint ?: null,
        ];
    }

    /**
     * @return list<array{name: string, expires: int}>
     */
    private function parseNetscape(string $path): array
    {
        $cookies = [];
        $handle = fopen($path, 'r');

        if ($handle === false) {
            return [];
        }

        try {
            while (($line = fgets($handle)) !== false) {
                $line = trim($line);

                if ($line === '' || (str_starts_with($line, '#') && ! str_starts_with($line, '#HttpOnly_'))) {
                    continue;
                }

                if (str_starts_with($line, '#HttpOnly_')) {
                    $line = substr($line, strlen('#HttpOnly_'));
                }

                $parts = explode("\t", $line);

                if (count($parts) < 7 || ! str_contains(strtolower($parts[0]), 'youtube.com')) {
                    continue;
                }

                $cookies[] = [
                    'name' => $parts[5],
                    'expires' => $this->parseExpires($parts[4]),
                ];
            }
        } finally {
            fclose($handle);
        }

        return $cookies;
    }

    /**
     * Netscape expiry is unix seconds. Chrome often writes UINT64_MAX
     * (18446744073709551615) as a session sentinel — casting that to int
     * overflows to PHP_INT_MAX and Carbon::createFromTimestampUTC throws
     * "Unexpected data found. Trailing data".
     */
    private function parseExpires(string $raw): int
    {
        if (! ctype_digit($raw)) {
            return 0;
        }

        // 9999-12-31 23:59:59 UTC — beyond what we bother treating as real.
        $max = '253402300799';

        if (strlen($raw) > strlen($max) || (strlen($raw) === strlen($max) && $raw > $max)) {
            return 0;
        }

        return (int) $raw;
    }
}
