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
- Use `npm run build` as your build command (Vercel default)
- Run `npm run build:trigger` to deploy the trigger functions
