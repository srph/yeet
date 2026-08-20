<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

/**
 * The three numbers behind the dashboard's Traffic card: all-time, this
 * calendar month, and last calendar month.
 *
 * A read model shaped for one card, which is why it isn't a scope on
 * SiteView — it returns a finished array, not a builder to compose with.
 */
class SiteViewSummary
{
    /**
     * One pass over site_views, summed across pages. No `group by`, so the
     * per-page rows add together into the combined figure the card wants; the
     * split is a `group by page` away whenever it's wanted.
     *
     * CASE rather than Postgres' FILTER clause because the suite runs on
     * SQLite: same plan, one scan, portable.
     *
     * Month boundaries are the app timezone (UTC), same as every other
     * timestamp this app renders.
     */
    public function __invoke(): array
    {
        $monthStart = now()->startOfMonth();
        $previousStart = $monthStart->copy()->subMonth();

        $row = DB::table('site_views')
            ->selectRaw('coalesce(sum(views), 0) as total')
            ->selectRaw('coalesce(sum(case when date >= ? then views else 0 end), 0) as month', [
                $monthStart->toDateString(),
            ])
            ->selectRaw('coalesce(sum(case when date >= ? and date < ? then views else 0 end), 0) as previous_month', [
                $previousStart->toDateString(), $monthStart->toDateString(),
            ])
            ->selectRaw('min(date) as since')
            ->first();

        return [
            'total' => (int) $row->total,
            'month' => (int) $row->month,
            // Null, not 0, when nothing was recorded before this month began.
            // A zero would render as a truthful-looking "0 in July" for a month
            // that predates the counter entirely; null hides the line instead.
            'previous_month' => $row->since && $row->since < $monthStart->toDateString()
                ? (int) $row->previous_month
                : null,
            // Drives the "since" label, which is what stops a three-week-old
            // total from reading as a lifetime figure. Null until the first
            // view lands.
            'since' => $row->since,
        ];
    }
}
