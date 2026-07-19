# Yeet

Download videos from YouTube, X, Facebook, TikTok and Douyin.

Laravel + Inertia + React. Extraction via [yt-dlp](https://github.com/yt-dlp/yt-dlp).

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
