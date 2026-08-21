<?php

namespace App\Services;

use App\Http\Middleware\CountView;
use Illuminate\Support\Facades\DB;

/**
 * The numbers behind the dashboard's Traffic card: the three headline figures,
 * plus the daily series the chart draws.
 *
 * A read model shaped for one card, which is why it isn't a scope on
 * SiteView — it returns a finished array, not a builder to compose with.
 */
class SiteViewSummary
{
    /**
     * Days in the chart window, today inclusive. Thirty columns at the card's
     * width leave each bar around 18px, which is what the per-page split needs
     * to stay legible; sixty would halve that.
     */
    public const WINDOW = 30;

    public function __invoke(): array
    {
        return [...$this->totals(), 'daily' => $this->daily()];
    }

    /**
     * One pass over site_views, summed across pages. No `group by`, so the
     * per-page rows add together into the combined figure the card wants.
     *
     * CASE rather than Postgres' FILTER clause because the suite runs on
     * SQLite: same plan, one scan, portable.
     *
     * Month boundaries are the app timezone (UTC), same as every other
     * timestamp this app renders.
     */
    private function totals(): array
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
            // Kept even though the card no longer prints it: it still decides
            // whether an all-time total this young is safe to show unqualified.
            'since' => $row->since,
        ];
    }

    /**
     * One row per day in the window, per page, gap-filled.
     *
     * The gap fill is the whole point of doing this in PHP rather than handing
     * the raw rows over. A day with no traffic has no row at all, and a chart
     * that renders only the rows it was given silently compresses time — a dead
     * week ends up looking like a busy one. Every day in the window gets an
     * entry, whether or not anything was recorded.
     *
     * `pages` is the union of the routes CountView is counting today and any
     * route that appears in the window, so a page that has since been dropped
     * from COUNTED still adds up rather than vanishing from a bar whose total
     * includes it.
     */
    private function daily(): array
    {
        $start = now()->startOfDay()->subDays(self::WINDOW - 1);

        $rows = DB::table('site_views')
            ->select('date', 'page')
            ->selectRaw('sum(views) as views')
            ->where('date', '>=', $start->toDateString())
            ->groupBy('date', 'page')
            ->get();

        $counts = [];
        foreach ($rows as $row) {
            // Postgres hands back a date, SQLite a string; both stringify to
            // the 'Y-m-d' every writer stores, which is the key used here.
            $counts[(string) $row->date][$row->page] = (int) $row->views;
        }

        $pages = array_values(array_unique([
            ...CountView::COUNTED,
            ...$rows->pluck('page')->all(),
        ]));

        $daily = [];
        for ($day = $start->copy(), $i = 0; $i < self::WINDOW; $i++, $day->addDay()) {
            $date = $day->toDateString();
            $today = $counts[$date] ?? [];

            $daily[] = [
                'date' => $date,
                'views' => array_sum($today),
                'pages' => array_map(fn (string $page) => $today[$page] ?? 0, array_combine($pages, $pages)),
            ];
        }

        return $daily;
    }
}
