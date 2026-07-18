# Yeet

Download videos from YouTube, X, and Facebook as mp3/mp4.

Laravel + Inertia + React. Extraction via `yt-dlp` (`app/Sources/YtDlp.php`). Jobs on the `downloads` queue. Legacy Next.js app in `legacy/` for porting reference only.

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

## Endpoints

| Method | Path                       | Notes                                                                                                          |
| ------ | -------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/`                        | Inertia `Home` — UI only; data via React Query                                                                 |
| `POST` | `/api/download`            | Body: `{ url, format: "mp3"\|"mp4" }`. Throttled 10/min. Returns `Download` JSON (dedupes non-failed/expired). |
| `GET`  | `/api/download/{download}` | Poll target (~1s). 404 if missing. Same JSON shape as POST.                                                    |

`Download` serializes directly (no resource layer). Status: `queued → processing → complete \| failed`, then `expired` after prune. `download_url` is a fresh presigned link from `storage_key`.

## CSS

- **Focus:** Interactive links/buttons get `focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-200` applied per element (not globally). Text inputs use their own border/ring focus styles.
