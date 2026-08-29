# Analytics

Basic traffic counting for the Control Room. Two numbers: views all-time, and
views this month. No third-party script, no cookie, no consent banner.

## What counts as a view

A `GET` on a public page — `/` and `/about` — including Inertia navigations
between them. Explicitly **not** counted:

- Anything under `auth` (the dashboard counting itself is noise)
- Non-`GET`, and the `/api/*` polling routes (~1 req/s per download would
  drown everything else)
- Non-2xx responses (a 404 or 500 isn't a page view)
- Inertia partial reloads (`X-Inertia-Partial-Data` present) — the cookie
  banner polls `router.reload({ only: [...] })` and those are not page views
- Prefetches (`Sec-Purpose: prefetch`, `Purpose: prefetch`)
- Obvious bots by user agent (`bot|crawler|spider|curl|wget|headless`, plus a
  few named crawlers that don't match those generic words)

Raw views, not uniques. A unique-per-day count needs a visitor identity;
the only no-cookie option is a hashed `IP + UA + daily salt`, which is more
machinery than "basic" asks for. Noted as a possible v2.

## Storage

One row per page per day, not one row per hit, and not a stored running total.

```
site_views
  id     bigint pk
  date   date
  page   varchar(32)   -- route name: 'home' | 'about'
  views  unsigned int default 0

  unique (date, page)
```

Two rows a day — ~730 a year, ~44 KB — never pruned. Total, month-to-date and
any per-day question are all `SUM`s over the same immutable facts.

A stored `total_views` counter was considered and rejected. It makes the
all-time read O(1) instead of a `SUM`, but that read happens a handful of times
a day while the write happens on every view, so it optimises the wrong side by
about four orders of magnitude. It also puts every page view on one row —
which serialises writers and churns tuple versions — and leaves nothing to
recompute from if it drifts. A monthly rollup table maintained by a scheduled
job has the same problem plus a job that can miss or double-run.

Counting is one atomic upsert per request, no read-modify-write:

```sql
insert into site_views (date, page, views, created_at, updated_at)
values (?, ?, 1, now(), now())
on conflict (date, page) do update
  set views = site_views.views + 1, updated_at = now()
```

New middleware `CountView`, appended to the `web` group and short-circuiting
on every exclusion above. It runs in `terminate()`, after the response is on
the wire, so a counting failure can never delay or break a page render.

If traffic ever grows enough for per-request writes to matter, the fix is to
buffer increments in the cache and flush once a minute from the scheduler —
capping writes at 1,440/day with no schema change, because the table is
already the right shape.

## Numbers on the dashboard

`DashboardController@index` adds an `analytics` prop from a single grouped
query (`SUM(views)` overall, and `SUM(views)` for the current and previous
calendar month, in app timezone):

```php
'analytics' => [
    'total' => 12480,
    'month' => 3120,          // month-to-date, resets on the 1st
    'previous_month' => 4102, // last month's final, for comparison
    'since' => '2026-08-18',  // first row's date
]
```

No projection. `month` is the plain running total for the current calendar
month and nothing is forecast from it.

`previous_month` is settled data, not a forecast, and is the cheapest fix for
month-to-date's one weakness — that on the 2nd of the month it's a small
number with nothing to measure against. Drop it if the comparison isn't
wanted; nothing else depends on it.

## UI

New `resources/js/dashboard/dashboard-views-card.tsx`, rendered as the first
child of `<main>` in `dashboard.tsx`, above `DashboardCookieBanner`.

Same `LayerCard` / `LayerCardSecondary` / `LayerCardContent` shell as the
cookie card so the two stack as one column. Header reads `Traffic`; content is
a two-up grid of big numbers rather than the cookie card's leader rows —
these are the headline figures, not a spec sheet.

- **Total views** — `font-mono tabular-nums`, ~28px, white. Caption below in
  `text-neutral-500`: `since Aug 18, 2026`.
- **This month** — same treatment, labelled with the month name (`August`) so
  it's obvious this is a calendar month that resets, not a rolling 30 days.
  Caption: a plain reference figure once there is a previous month —
  `4,102 in July`. Not a % delta: a percentage between a partial month and a
  complete one reads as a ~90% collapse every 3rd of the month. An honest
  delta needs same-day-of-month comparison, which is a third query.

Per `AGENTS.md`, stats are `font-mono`; numbers get `tabular-nums` so they
don't jitter between renders. `Intl.NumberFormat` for the thousands
separators.

The `Spec` leader-row component is currently copy-pasted in
`dashboard-cookie-banner.tsx` and `home-download-tracking.tsx`. This card does
not need it, so no extraction here — but a third copy would be the signal.

## Chart

The card also draws a 30-day chart, one more query returning ~30 rows
(`SiteViewSummary::daily()`). It gap-fills: every day in the window gets an
entry whether or not anything was recorded, so a dead week doesn't compress
into a shorter bar than a busy one. `pages` per day is keyed off the union of
`CountView::COUNTED` and whatever page names actually appear in the window —
a route dropped from `COUNTED` still has history, and its views are already
folded into the day's total.

## Not in scope

Referrers, countries, downloads-per-month. The per-page split is stored and
feeds the chart, but the headline numbers are combined across pages — a
`group by page` surfaces the breakdown further if it's ever wanted.

## Tests

- `GET /` twice plus `GET /about` once leaves two rows (one per page), at
  2 and 1 — the repeat incremented rather than inserted
- Excluded requests (`/api/*`, partial reload header, prefetch header, bot UA,
  authed dashboard) leave the table untouched
- Dashboard prop shape: totals sum across pages; `month` counts only the
  current calendar month and resets across a month boundary; `previous_month`
  is null with no history
