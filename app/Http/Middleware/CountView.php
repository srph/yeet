<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class CountView
{
    /**
     * Route *names*, not paths — these are also the values stored in the
     * `page` column, so the table keys off something that survives a URL
     * change.
     *
     * Public because SiteViewSummary zero-fills the dashboard's daily series
     * against it: a page that is counted but had no traffic on a given day
     * still needs a 0, not a missing key.
     */
    public const COUNTED = ['home', 'about'];

    /**
     * The high-volume commercial crawlers all self-identify, so this catches
     * essentially all of them. What it can't catch is a scraper spoofing
     * Chrome; that's the accepted inaccuracy, and the reason this is a list
     * to extend rather than a problem to solve. facebookexternalhit is here
     * because it matches none of the generic words.
     */
    private const BOTS = '/bot|crawl|spider|slurp|curl|wget|headless|lighthouse|monitor|preview|facebookexternalhit/i';

    public function handle(Request $request, Closure $next): Response
    {
        return $next($request);
    }

    /**
     * Runs after the response is on the wire. A slow or failing write here
     * costs the visitor nothing, which is the correct trade: the counter is a
     * nice-to-have, the page is not.
     */
    public function terminate(Request $request, Response $response): void
    {
        if (! $this->countable($request, $response)) {
            return;
        }

        $now = now();

        // One statement, no read-modify-write, so concurrent requests on the
        // same day cannot lose an increment. (date, page) is the unique
        // conflict target from the migration. The raw expression compiles the
        // same on Postgres and SQLite, so the tests exercise real SQL.
        DB::table('site_views')->upsert(
            [[
                'date' => $now->toDateString(),
                'page' => $request->route()->getName(),
                'views' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ]],
            ['date', 'page'],
            ['views' => DB::raw('site_views.views + 1'), 'updated_at' => $now],
        );
    }

    private function countable(Request $request, Response $response): bool
    {
        // The route-name gate does most of the work: it excludes /api/*
        // polling (~1 req/s per active download), every POST, and the
        // dashboard measuring itself — all in one condition.
        if (! $request->isMethod('GET') || ! $request->routeIs(...self::COUNTED)) {
            return false;
        }

        if (! $response->isSuccessful()) {
            return false;
        }

        // The operator reloading / while signed in is not the audience this
        // number is about, and is the visitor most likely to do it repeatedly.
        if ($request->user()) {
            return false;
        }

        // Inertia partial reloads are a data refresh for a page already open.
        // The cookie card polls with router.reload({ only: [...] }) every 2s
        // during a probe; counting those is self-inflicted noise.
        if ($request->hasHeader('X-Inertia-Partial-Data')) {
            return false;
        }

        // Link prefetch: fetched by the browser, never looked at.
        if ($request->header('Sec-Purpose') === 'prefetch'
            || $request->header('Purpose') === 'prefetch') {
            return false;
        }

        return ! preg_match(self::BOTS, (string) $request->userAgent());
    }
}
