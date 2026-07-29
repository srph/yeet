# Yeet

Download videos from YouTube, X, Facebook, TikTok, and Douyin as mp3/mp4.

Laravel + Inertia + React. Extraction via `yt-dlp` (`app/Sources/YtDlp.php`). Jobs on the `downloads` queue.

## Starting

```sh
npm run dev                                # vite
php artisan serve                          # app
php artisan queue:work --queue=downloads   # jobs
```

## Stack

- **Backend:** Laravel, Postgres, queue jobs (`downloads`)
- **Frontend:** Inertia + React + Vite, React Query, Tailwind
- **Extraction:** `yt-dlp` + `ffmpeg`
- **Storage:** S3-compatible object storage

## Cookies

Two jars, both files on disk, both pointed at by env.

| | `YTDLP_COOKIES` | `DOUYIN_COOKIES` |
| --- | --- | --- |
| Covers | everything except Douyin | Douyin only |
| Written by | browser export, throwaway account | `php artisan ytdlp:douyin` |
| Inspect | `php artisan ytdlp:check` | `php artisan ytdlp:douyin` (no-op when present) |

Neither is minted at request time — a missing Douyin jar throws, naming the
command. `App\Services\DouyinCookies` has the why.

Each jar belongs to its adapter's `Source::ytdlpArgs()`, not to `YtDlp`.
`YtDlp` contributes only what every source gets (`--no-playlist`,
`--playlist-items 1`, `--no-warnings`) and appends whatever the resolved
source asks for — bot-check workarounds, cookies, spoofed headers. Adding a
source with a new quirk should never mean editing `YtDlp`.

## Endpoints

| Method | Path                       | Notes                                                                                                          |
| ------ | -------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/`                        | Inertia `Home` — UI only; data via React Query                                                                 |
| `POST` | `/api/download`            | Body: `{ url, format: "mp3"\|"mp4" }`. Throttled 10/min + 50/day per IP. Max file 200 MiB. Returns `Download` JSON (dedupes non-failed/expired). |
| `GET`  | `/api/download/{download}` | Poll target (~1s). 404 if missing. Same JSON shape as POST.                                                    |

`Download` serializes directly (no resource layer). Status: `queued → probing → processing → complete \| failed`, then `expired` after prune. Probe (yt-dlp metadata) runs in the job, not on POST. `download_url` is a fresh presigned link from `storage_key`.

## CSS

- **Focus:** Interactive links/buttons get `focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-200` applied per element (not globally). Text inputs use their own border/ring focus styles.
