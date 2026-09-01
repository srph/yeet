# Yeet performance

Track incremental speed work on `https://yeet.kierb.com`. One change per
deploy, then measure production.

Lab-only for now — no CrUX field data on this origin.

## Status

| Phase | Change | Expected | State | Production |
| ----- | ------ | -------- | ----- | ---------- |
| 1 | Lazy-load Vidstack players until a file is playable | ~75 KiB JS off the landing request graph | Pushed | Waiting for production |
| 2 | Dynamic-import Zod at first API parse | ~17 KiB JS off initial load | Not started | — |
| 3 | `Cache-Control: public, max-age=31536000, immutable` on `/build/assets/*` | Repeat-visit savings (~279 KiB per PSI) | Not started | — |
| 4a | Intrinsic `width`/`height` on `/logo.svg` | Clears image-dimension diagnostic | Not started | — |
| 4b | Move Vidstack CSS out of global `app.css` | Smaller CSS on landing | After phase 1 is measured | — |
| 4c | Drop unused Playfair imports | Smaller build output, not transfer | Cleanup only | — |

**Next:** wait for production, then measure phase 1.

## How we measure

PageSpeed Insights and cache-header checks need the change **live on
production**. Local `npm run build` only proves the chunk graph.

After each deploy:

1. Confirm the chunk/header check for that phase (see below).
2. Run mobile PageSpeed **three times**. Compare the **median** to baseline.
3. Treat under 100ms as noise. 200ms+ LCP/FCP is a real move. Ignore score jitter.

Local Chrome traces (Slow 4G, 4× CPU, cache bypass) are a supplement, not a
substitute — they will not match PSI numbers.

### Phase checks

- **1:** cold load of `/` must not request `vidstack-*` or `home-download-*-player-*`.
- **2:** cold load must not request `types-*`; it should appear after submit.
- **3:** `curl -I` a hashed `/build/assets/*` file → one-year immutable. HTML and `/logo.svg` stay short-lived.

## Baseline

PageSpeed mobile, 1 Sep 2026, 9:40 AM GMT+8
([report](https://pagespeed.web.dev/analysis/https-yeet-kierb-com/h40lhbtmt6?form_factor=mobile)):

| Metric | Value | Rating |
| ------ | ----- | ------ |
| Performance | 92 | good |
| FCP | 2.4s | needs improvement |
| LCP | 2.9s | needs improvement |
| TBT | 0ms | good |
| CLS | 0.001 | good |
| Speed Index | 2.4s | good |

LCP element is the headline text (`span.block`), not an image. TTFB was fine;
almost all LCP time is **render delay** waiting on JS.

### Production medians

| When | FCP | LCP | TBT | CLS | Notes |
| ---- | --- | --- | --- | --- | ----- |
| 2026-09-01 baseline | 2.4s | 2.9s | 0ms | 0.001 | Pre–phase 1 |

## Findings

Landing is a client-rendered Inertia shell. The form does not paint until JS
runs. Unused-JS on the PSI run was **120 KiB**, mostly:

| Resource | Transfer | Unused |
| -------- | -------- | ------ |
| `app-*.js` | 102.6 KiB | 59.3 KiB |
| `vidstack-*.js` | 44.4 KiB | 39.4 KiB |
| `react-*.js` | 38.3 KiB | 21.5 KiB |

Vidstack was statically imported from the tracking screen, which `home.tsx`
loads on first paint — so the player shipped before anyone submitted a URL.

Other PSI notes, deprioritized:

- Render-blocking CSS: ~160ms estimated. Skip until JS is off the critical path.
- Cache TTL 4h on hashed `/build/assets/*`: repeat visits only (phase 3).
- Playfair is in the build output but the browser did not download it.
- Cloudflare insights beacon: ~25ms main thread; no LCP estimate.
- Logo missing width/height: CLS already 0.001.
- Input `border-*-color` / `box-shadow` transition: non-composited animation, not LCP.

Uncached Slow 4G / 4× CPU trace of production (1 Sep 2026): LCP **4.0s**,
TTFB 535ms, render delay 3.5s. Same story — JS-bound text LCP.

## Phase 1 notes

`HomeDownloadVideoPlayer` / `HomeDownloadAudioPlayer` are `React.lazy` in
`home-download-tracking.tsx`. Tracking mounts → prefetch the format’s player
chunk so it is usually warm when `download_url` exists. Suspense fallback
keeps the plate footprint (16:9 video / square audio).

Local production build (not yet live): `home.tsx` static imports tracking, but
tracking lists the players only under `dynamicImports`. Vidstack is not in
the landing graph.
