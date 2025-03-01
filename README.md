# yeet

Web UI for ytdl-core

## Stack

- @distube/ytdl-core - Does the heavy lifting
- trigger.dev - Background jobs to run ytdl-core
- s3 - Storage for ytdl output
- Prisma - ORM to track jobs and metadata

## Requirements

- Node.js 20+
- Docker

## Setup

```bash
npm install
npm run dev:db
npm run dev:prisma
npm run dev:trigger
npm run dev
```
