# Cookies

Two yt-dlp cookie jars, both plain files on disk, both located by env var.
Not browser cookies for a consent banner — these are session cookies for the
source sites themselves, so `yt-dlp` doesn't get bot-checked on datacenter
IPs.

| | `YTDLP_COOKIES` | `DOUYIN_COOKIES` |
| --- | --- | --- |
| Covers | everything except Douyin | Douyin only |
| Written by | browser export, throwaway account | `php artisan ytdlp:douyin` |
| Inspect | `php artisan ytdlp:check` | `php artisan ytdlp:douyin` (no-op when present) |

## Why two jars

`yt-dlp` only sends a cookie to a request whose domain matches the cookie's
domain, so a youtube.com jar (`YTDLP_COOKIES`) never reaches Douyin's API.
Douyin's web endpoint replies with an empty body and a slide-CAPTCHA header
unless the request carries a `ttwid` cookie, a browser User-Agent, and a
`douyin.com` Referer together — `yt-dlp`'s own Douyin extractor can't solve
this (its signature-challenge handling is a TODO), so the app supplies all
three itself. The UA/Referer live in `YtDlp`; the `ttwid` is owned by
`App\Services\DouyinCookies`.

A `ttwid` identifies a browser, not a person — ByteDance hands one out to
anyone who registers, no login involved — which is why `DouyinCookies::mint()`
can synthesize a fresh jar from a plain HTTP call instead of needing an
exported browser session like the YouTube jar does.

## Minting and reading

Neither jar is minted at request time.

- `YTDLP_COOKIES` is a manual browser export from a throwaway account,
  checked with `php artisan ytdlp:check` — reports cookie names and
  session-cookie expiry, and can live-probe a URL. Never prints values.
- `DOUYIN_COOKIES` is minted by `php artisan ytdlp:douyin`, which calls
  `DouyinCookies::mint()`; the command is a no-op if the jar already exists.

A missing Douyin jar throws from `DouyinCookies::jar()`, naming the command
to fix it — the alternative, downloading without cookies, just fails later
with a message that doesn't mention cookies at all.

## Ownership

Each jar belongs to its adapter's `Source::ytdlpArgs()`, not to `YtDlp`.
`YtDlp` contributes only what every source gets (`--no-playlist`,
`--playlist-items 1`, `--no-warnings`) and appends whatever the resolved
source asks for — bot-check workarounds, cookies, spoofed headers. Adding a
source with a new quirk should never mean editing `YtDlp`.

## Dashboard health check

`CookieHealthInspector` backs the dashboard's cookie card: it reads
`YTDLP_COOKIES`, confirms a session cookie (`__Secure-3PSID` /
`__Secure-1PSID` / `SID`) is present and unexpired, and does a live probe —
throwing a specific, human-readable reason (missing file, no session cookie,
expired, probe failed) rather than a generic failure.
