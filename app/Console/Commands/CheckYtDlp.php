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
 * Never prints cookie values — names, counts, and expiry only.
 */
#[Signature('ytdlp:check {--probe : Live-probe a YouTube URL and report whether streams are available} {--url= : URL used with --probe (default rickroll)}')]
#[Description('Inspect YTDLP_COOKIES health and optionally live-probe YouTube')]
class CheckYtDlp extends Command
{
    /** Cookie names that usually mean a logged-in YouTube session. */
    private const CRITICAL = [
        'LOGIN_INFO',
        'SID',
        '__Secure-1PSID',
        '__Secure-3PSID',
        'SAPISID',
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

        $parsed = $this->parseNetscape($path);

        $this->newLine();
        $this->info('youtube cookies');
        $this->line("  count: {$parsed['count']}");

        if ($parsed['count'] === 0) {
            $this->error('No youtube.com cookies found in the file.');

            return self::FAILURE;
        }

        foreach (self::CRITICAL as $name) {
            $present = in_array($name, $parsed['names'], true);
            $this->line('  '.($present ? '✓' : '✗')." {$name}");
        }

        if ($parsed['earliest_expiry'] !== null) {
            $expiresIn = $parsed['earliest_expiry'] - time();
            $label = $expiresIn < 0
                ? 'EXPIRED '.date('c', $parsed['earliest_expiry'])
                : date('c', $parsed['earliest_expiry']).' (in '.round($expiresIn / 86400, 1).' days)';

            $this->line("  earliest expiry: {$label}");

            if ($expiresIn < 0) {
                $this->warn('At least one YouTube cookie is already expired.');
            }
        } else {
            $this->line('  earliest expiry: (session cookies only / none dated)');
        }

        $missingCritical = array_values(array_filter(
            self::CRITICAL,
            fn (string $name) => ! in_array($name, $parsed['names'], true),
        ));

        // LOGIN_INFO + one of the PSID/SID family is the usual bar.
        $hasLogin = in_array('LOGIN_INFO', $parsed['names'], true);
        $hasSid = (bool) array_intersect(
            ['SID', '__Secure-1PSID', '__Secure-3PSID'],
            $parsed['names'],
        );

        if (! $hasLogin || ! $hasSid) {
            $this->warn('Missing typical logged-in session cookies: '.implode(', ', $missingCritical));
            $this->warn('File may be from a logged-out browser — expect no_formats on Forge.');
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
     * @return array{count: int, names: list<string>, earliest_expiry: ?int}
     */
    private function parseNetscape(string $path): array
    {
        $names = [];
        $earliest = null;

        $handle = fopen($path, 'r');

        if ($handle === false) {
            return ['count' => 0, 'names' => [], 'earliest_expiry' => null];
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

                // Names only — never touch $parts[6] (the value).
                $names[] = $name;

                $exp = (int) $expiration;

                // 0 = session cookie; ignore for "earliest expiry".
                if ($exp > 0 && ($earliest === null || $exp < $earliest)) {
                    $earliest = $exp;
                }
            }
        } finally {
            fclose($handle);
        }

        return [
            'count' => count($names),
            'names' => array_values(array_unique($names)),
            'earliest_expiry' => $earliest,
        ];
    }
}
