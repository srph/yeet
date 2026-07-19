# Yeet

Download videos from YouTube, X, Facebook, TikTok and Douyin.

Laravel + Inertia + React. Extraction is handled by [yt-dlp](https://github.com/yt-dlp/yt-dlp),
which replaced `youtubei.js` — that retires the `PLAYER_ID` that had to be hand-updated
whenever YouTube shipped a player change, and it supports X, Facebook, TikTok and Douyin for free.

## Requirements

- PHP 8.3+
- Postgres
- Node 22+
- `yt-dlp` and `ffmpeg` — ffmpeg is required to merge YouTube's separate
  video/audio streams into mp4, and to transcode mp3

```sh
brew install yt-dlp ffmpeg
```

## Setup

```sh
composer install
npm install
cp .env.example .env && php artisan key:generate
php artisan migrate
```

Set `AWS_*` in `.env` to point at your S3-compatible bucket, and `YTDLP_BINARY`
to the absolute path of yt-dlp (`which yt-dlp`) — the queue worker may not
inherit a PATH containing homebrew.

## Running

```sh
npm run dev                                  # vite
php artisan serve                            # app
php artisan queue:work --queue=downloads     # downloads run here
```

## Architecture

| Concern | Where |
| --- | --- |
| Adding a source | A `Source` in `app/Sources`, registered in `AppServiceProvider` |
| Extraction | `app/Sources/YtDlp.php` — shells out; one code path for every source |
| The download job | `app/Jobs/ProcessDownload.php` (replaced the trigger.dev task) |
| API contract | `app/Models/Download.php` — no resource layer; Eloquent serializes it |
| Cleanup | `downloads:prune`, hourly — deletes expired objects |

### Things that will bite you

- **`status` is the state machine**: `queued → processing → complete | failed`,
  plus `expired` once prune deletes the object. There is no `expired_at` column —
  expiry is a status. `expires_at` has exactly one reader: the prune command.
- **`storage_key` is stored, not a presigned URL.** Links are minted per-read by
  the model's `download_url` accessor, so they're always fresh for a full hour.
- **`DB_QUEUE_RETRY_AFTER` must exceed the job's `$timeout`** (3600). At the
  default 90s the queue reclaims a job mid-download and runs it a second time.
- **`filesystems.disks.s3.throw` is `true`.** Laravel defaults it to `false`,
  which silently turns a failed upload into a `complete` row with a dead link.
