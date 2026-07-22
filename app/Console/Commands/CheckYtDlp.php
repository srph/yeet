<?php

namespace App\Console\Commands;

use App\Exceptions\SourceUnavailable;
use App\Sources\YtDlp;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Throwable;

/**
 * Ops check for the YouTube cookies file and (optionally) a live probe.
 * Never prints cookie values — names and expiry only.
 */
#[Signature('ytdlp:check {--probe : Live-probe a YouTube URL and report whether streams are available} {--url= : URL used with --probe (default rickroll)}')]
#[Description('Inspect YTDLP_COOKIES health and optionally live-probe YouTube')]
class CheckYtDlp extends Command
{
    /**
     * Modern Chrome exports lean on these. Older LOGIN_INFO/SID/SAPISID
     * checklists false-alarm on otherwise working files.
     */
    private const SESSION_COOKIES = [
        '__Secure-3PSID',
        '__Secure-1PSID',
        'SID',
    ];

    private const DEFAULT_PROBE_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

    public function handle(YtDlp $ytdlp): int
    {
        $binary = config('services.ytdlp.binary');
        $path = config('services.ytdlp.cookies') ?: null;

        $this->info('yt-dlp');
        $this->line("  binary:  {$binary}");
        $this->line('  cookies: '.($path ?? '(not set)'));

        if (! $path) {
            $this->error('YTDLP_COOKIES is not set.');

            return self::FAILURE;
        }

        if (! is_file($path)) {
            $this->error("Cookies file does not exist: {$path}");

            return self::FAILURE;
        }

        if (! is_readable($path)) {
            $this->error("Cookies file is not readable: {$path}");

            return self::FAILURE;
        }

        $mtime = filemtime($path) ?: 0;
        $ageDays = $mtime > 0
            ? round((time() - $mtime) / 86400, 1)
            : null;

        $this->newLine();
        $this->info('cookies file');
        $this->line('  exists:   yes');
        $this->line('  readable: yes');
        $this->line('  size:     '.filesize($path).' bytes');
        $this->line('  mtime:    '.($mtime ? date('c', $mtime)." ({$ageDays} days ago)" : 'unknown'));

        $cookies = $this->parseNetscape($path);

        $this->newLine();
        $this->info('youtube cookies ('.count($cookies).')');

        if ($cookies === []) {
            $this->error('No youtube.com cookies found in the file.');

            return self::FAILURE;
        }

        $nameWidth = max(array_map(fn (array $c) => strlen($c['name']), $cookies));

        foreach ($cookies as $cookie) {
            $this->line('  '.$this->formatCookieRow($cookie, $nameWidth));
        }

        $names = array_column($cookies, 'name');
        $sessionName = collect(self::SESSION_COOKIES)->first(
            fn (string $name) => in_array($name, $names, true),
        );

        $this->newLine();
        $this->info('session');

        if ($sessionName === null) {
            $this->warn('  no SID / __Secure-1PSID / __Secure-3PSID — likely logged out');
        } else {
            $session = collect($cookies)->firstWhere('name', $sessionName);
            $this->line("  cookie:  {$sessionName}");
            $this->line('  expires: '.$this->formatExpiry($session['expires']));
        }

        if ($this->option('probe')) {
            $this->newLine();
            $url = (string) ($this->option('url') ?: self::DEFAULT_PROBE_URL);
            $this->info("probe {$url}");

            try {
                $meta = $ytdlp->probe($url);
                $this->line('  ok:       yes');
                $this->line('  title:    '.($meta['title'] ?? 'Untitled'));
                $this->line('  duration: '.($meta['duration'] ?? 'null'));
            } catch (SourceUnavailable $e) {
                $this->error('  ok: no');
                $this->error('  '.$e->getMessage());

                return self::FAILURE;
            } catch (Throwable $e) {
                $this->error('  ok: no');
                $this->error('  '.$e::class.': '.$e->getMessage());

                return self::FAILURE;
            }
        }

        return self::SUCCESS;
    }

    /**
     * @param  array{name: string, expires: int}  $cookie
     */
    private function formatCookieRow(array $cookie, int $nameWidth): string
    {
        return sprintf("%-{$nameWidth}s  %s", $cookie['name'], $this->formatExpiry($cookie['expires']));
    }

    private function formatExpiry(int $expires): string
    {
        if ($expires === 0) {
            return 'session';
        }

        $label = gmdate('Y-m-d\TH:i:s\Z', $expires);

        if ($expires < time()) {
            return "EXPIRED {$label}";
        }

        $days = round(($expires - time()) / 86400, 1);

        return "{$label} (in {$days} days)";
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

                // HttpOnly rows are stored as "#HttpOnly_.youtube.com\t..."
                if (str_starts_with($line, '#HttpOnly_')) {
                    $line = substr($line, strlen('#HttpOnly_'));
                }

                $parts = explode("\t", $line);

                // domain flag path secure expiration name value
                if (count($parts) < 7) {
                    continue;
                }

                [$domain, , , , $expiration, $name] = $parts;

                if (! str_contains(strtolower($domain), 'youtube.com')) {
                    continue;
                }

                // Names + expiry only — never touch $parts[6] (the value).
                $cookies[] = [
                    'name' => $name,
                    'expires' => $this->parseExpires($expiration),
                ];
            }
        } finally {
            fclose($handle);
        }

        return $cookies;
    }

    /**
     * @see CookieHealthInspector::parseExpires()
     */
    private function parseExpires(string $raw): int
    {
        if (! ctype_digit($raw)) {
            return 0;
        }

        $max = '253402300799';

        if (strlen($raw) > strlen($max) || (strlen($raw) === strlen($max) && $raw > $max)) {
            return 0;
        }

        return (int) $raw;
    }
}
