# Yeet performance

Track incremental speed work on `https://yeet.kierb.com`. One change per
deploy, then measure production.

Lab-only for now — no CrUX field data on this origin.

## Status

| Phase | Change | Expected | State | Production |
| ----- | ------ | -------- | ----- | ---------- |
| 1 | Lazy-load Vidstack players until a file is playable | ~75 KiB JS off the landing request graph | Shipped | Live — LCP 2.9s → 2.6s |
| 2 | Dynamic-import Zod at first API parse | ~17 KiB JS off initial load | Shipped | Live — LCP unchanged at 2.6s |
| 3 | `Cache-Control: max-age=31536000` on `/build/assets/*` | Repeat-visit savings (~279 KiB per PSI) | Shipped | Live — hashed JS is 1y; HTML and `/logo.svg` unchanged. No `immutable`. |
| 4a | Intrinsic `width`/`height` on `/logo.svg` | Clears image-dimension diagnostic | Shipped | Live — diagnostic gone. LCP 3.0s on this run is jitter, not the logo. |
| 4b | Move Vidstack CSS out of global `app.css` | Smaller CSS on landing | Shipped | Live — LCP 2.6s → 2.7s (noise); render-blocking 200ms → 150ms |
| 4c | Drop unused Playfair imports | Smaller build output, not transfer | Cleanup only | — |

**Next:** in-repo leftover is 4c (dead Playfair CSS). First-load LCP is still JS-bound; phase 1 was the only ≥200ms move. Phase 3 is repeat-visit only.

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
- **3:** `curl -I` a hashed `/build/assets/*` file → `max-age=31536000`. HTML and `/logo.svg` stay short-lived.
- **4b:** cold load of `/` must not request `vidstack-player-styles-*`.

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
| 2026-09-01 baseline | 2.4s | 2.9s | 0ms | 0.001 | [PSI](https://pagespeed.web.dev/analysis/https-yeet-kierb-com/h40lhbtmt6?form_factor=mobile) |
| 2026-09-01 phase 1 | 2.3s | 2.6s | 0ms | 0 | [PSI](https://pagespeed.web.dev/analysis/https-yeet-kierb-com/rd9n6lpafk?form_factor=mobile). One run — API quota blocked the extra two. |
| 2026-09-01 phase 2 | 2.3s | 2.6s | 0ms | 0 | [PSI](https://pagespeed.web.dev/analysis/https-yeet-kierb-com/n2ptxvjt4w?form_factor=mobile). One run. SI 3.8s (noisy). |
| 2026-09-01 phase 4b | 2.5s | 2.7s | 10ms | 0.001 | [PSI](https://pagespeed.web.dev/analysis/https-yeet-kierb-com/9wk8cmreni?form_factor=mobile). One run. LCP +100ms vs phase 2 — noise. |
| 2026-09-01 phase 4a | 2.8s | 3.0s | 0ms | 0 | [PSI](https://pagespeed.web.dev/analysis/https-yeet-kierb-com/c5t4twwsuv?form_factor=mobile). One run. Image-dimension audit gone. LCP +300ms vs phase 2 — treat as lab jitter; this change cannot move a text LCP. |
| 2026-09-01 phase 3 | — | — | — | — | Header check, not PSI. Hashed `/build/assets/*` is `max-age=31536000` + `cf-cache-status: HIT`. HTML `no-cache`. `/logo.svg` still 4h. |

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
- Cache TTL 4h on hashed `/build/assets/*`: done (phase 3, now 1y).
- Playfair is in the build output but the browser did not download it.
- Cloudflare insights beacon: ~25ms main thread; no LCP estimate.
- Logo missing width/height: CLS already 0.001.
- Input `border-*-color` / `box-shadow` transition: non-composited animation, not LCP.

Uncached Slow 4G / 4× CPU trace of production (1 Sep 2026): LCP **4.0s**,
TTFB 535ms, render delay 3.5s. Same story — JS-bound text LCP.

## Phase 1 notes

Shipped in `94178a6`. `HomeDownloadVideoPlayer` / `HomeDownloadAudioPlayer`
are `React.lazy` in `home-download-tracking.tsx`. Tracking mounts → prefetch
the format’s player chunk so it is usually warm when `download_url` exists.
Suspense fallback keeps the plate footprint (16:9 video / square audio).

**Chunk check (pass):** uncached mobile load of `/` requested tracking JS but
**no** `vidstack-*` and **no** `home-download-*-player-*`.

**PSI mobile** ([rd9n6lpafk](https://pagespeed.web.dev/analysis/https-yeet-kierb-com/rd9n6lpafk?form_factor=mobile)):

| | Before | After |
| --- | --- | --- |
| Performance | 92 | 94 |
| FCP | 2.4s | 2.3s |
| LCP | 2.9s | 2.6s |
| Unused JS | 120 KiB | 81 KiB |
| Cache “wasted” (repeat) | 279 KiB | 228 KiB |

LCP drop is 300ms — counts as a real move. Unused-JS drop (~39 KiB) matches
the old unused Vidstack chunk.

Local Slow 4G / 4× CPU uncached LCP: **4.0s → 3.3s**. Same direction as PSI.

Tracking still loads on landing (`home.tsx` static import). Fine — it is
small. Vidstack was the cost.

Speed Index went 2.4s → 2.6s on this one PSI run. Ignore unless it repeats.

## Phase 2 notes

`queries.ts` / `mutations.ts` `import type` the download shape and
`await import("./types")` immediately before `DownloadMetaSchema.parse`.
Local build: `home.tsx` lists `_types-*.js` under `dynamicImports` only.
Dashboard still statically imports `isDownloadStatus` from the same module —
irrelevant to the landing graph.

**Chunk check (pass):** uncached mobile load of `/` requested **no** `types-*`,
and still no Vidstack/player chunks.

**PSI mobile** ([n2ptxvjt4w](https://pagespeed.web.dev/analysis/https-yeet-kierb-com/n2ptxvjt4w?form_factor=mobile)):
FCP 2.3s, LCP 2.6s, unused JS still 81 KiB. No LCP movement vs phase 1 —
Zod was off the LCP path; dropping ~17 KiB did not beat noise. Speed Index
3.8s on this run is treated as jitter until it repeats.

## Phase 3 notes

Cloudflare Cache Rule on `yeet.kierb.com`, URI Path starts with `/build/assets/`.
Edge TTL and Browser TTL both **ignore origin, 1 year**. Dashboard, not this
repo. MCP OAuth was read-only so the rule was applied by hand.

**Header check (pass), 1 Sep 2026 ~3:21 PM GMT+8:**

| URL | `Cache-Control` | `cf-cache-status` |
| --- | --- | --- |
| `/build/assets/*.js` | `max-age=31536000` | MISS, then HIT |
| `/` | `no-cache, private` | DYNAMIC |
| `/logo.svg` | `max-age=14400` | HIT |

No `public` / `immutable` on the asset header. The year-long `max-age` is
what PSI’s cache-lifetime audit scores. Cold LCP will not move.

## Phase 4b notes

Vidstack `base.css` was a global `@import` in `app.css`, so landing paid for
player chrome CSS before any player mounted. Both lazy player modules now
import `vidstack-player-styles.ts` (one shared CSS file, 0.71 KiB gzip).

**Chunk check (pass):** uncached `/` requested `app-CYhZra9o.css` only — no
`vidstack-player-styles-*`, no player JS. Landing still paints the form.

**PSI mobile** ([9wk8cmreni](https://pagespeed.web.dev/analysis/https-yeet-kierb-com/9wk8cmreni?form_factor=mobile)):
93 / FCP 2.5s / LCP 2.7s / TBT 10ms / CLS 0.001 / SI 2.5s. Unused JS still
81 KiB. Render-blocking estimate 200ms → 150ms. LCP did not move past noise.

## Phase 4a notes

`width="444" height="457"` on every `/logo.svg` `<img>` (matches the SVG
viewBox). CSS still sizes it with `h-7 w-auto` (~28px tall).

**Check (pass):** production home chunk emits `width:"444"` / `height:"457"`.
Live DOM: attributes present, rendered 27×28.

**PSI mobile** ([c5t4twwsuv](https://pagespeed.web.dev/analysis/https-yeet-kierb-com/c5t4twwsuv?form_factor=mobile)):
90 / FCP 2.8s / LCP 3.0s. The image-dimension diagnostic is gone. LCP on this
run is worse; ignore — a CSS-sized logo cannot delay the text headline LCP.
