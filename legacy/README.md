# yeet

just another fancy youtube downloader frontend

## Stack

- youtubei.js - Does the heavy lifting
- trigger.dev - Background jobs to run ytdl-core
- s3 - Storage for ytdl output
- Prisma - ORM to track jobs and metadata

## Requirements

- Node.js 22+
- Docker

## Setup

First, create `.env` and use `.env.example` as base. Then:

```bash
npm install
npm run dev:db
npm run dev:prisma
npm run dev:trigger
npm run dev
```

## Deployment

- Sync environment variables between Vercel and Trigger.dev.
- Use `npm run build` as your build command (Vercel default) - this runs migrations and builds Next.js
- Run `npm run build:trigger` to deploy the trigger functions

## Troubleshooting

### YouTube Player ID Issues

If downloads fail with signature decipher errors like:

- `[YOUTUBEJS][Player]: Failed to extract signature decipher algorithm`
- 403 errors when accessing video URLs

This usually means YouTube has updated their player and the `PLAYER_ID` needs to be refreshed. To fix:

1. Update the `PLAYER_ID` value in your `.env` file
2. Get the latest player ID as documented [here](https://github.com/LuanRT/YouTube.js/issues/1043#issuecomment-3328154175)
