<?php

use App\Models\SiteView;
use App\Services\SiteViewSummary;

// Called directly: no auth, no route, no Inertia. Booting the dashboard to
// assert three integers was the reason this moved out of the controller.
$summary = fn () => app(SiteViewSummary::class)();

it('sums across pages', function () use ($summary) {
    $month = now()->startOfMonth();

    SiteView::create(['date' => $month->copy()->subMonth(), 'page' => 'home', 'views' => 400]);
    SiteView::create(['date' => $month, 'page' => 'home', 'views' => 30]);
    SiteView::create(['date' => $month, 'page' => 'about', 'views' => 5]);

    expect($summary())->toMatchArray([
        'total' => 435,
        'month' => 35,
        'previous_month' => 400,
        'since' => $month->copy()->subMonth()->toDateString(),
    ]);
});

it('counts only the current calendar month in month', function () use ($summary) {
    SiteView::create(['date' => now()->startOfMonth()->subDay(), 'page' => 'home', 'views' => 99]);
    SiteView::create(['date' => now()->startOfMonth(), 'page' => 'home', 'views' => 7]);

    expect($summary()['month'])->toBe(7);
});

it('hides the previous month when nothing predates this one', function () use ($summary) {
    SiteView::create(['date' => now()->startOfMonth(), 'page' => 'home', 'views' => 30]);

    expect($summary()['previous_month'])->toBeNull();
});

it('reports zeroes and no since date before anything is recorded', function () use ($summary) {
    expect($summary())->toMatchArray([
        'total' => 0,
        'month' => 0,
        'previous_month' => null,
        'since' => null,
    ]);
});

it('returns one gap-filled row per day in the window', function () use ($summary) {
    SiteView::create(['date' => now(), 'page' => 'home', 'views' => 12]);

    $daily = $summary()['daily'];

    expect($daily)->toHaveCount(SiteViewSummary::WINDOW)
        ->and($daily[0]['date'])->toBe(now()->startOfDay()->subDays(SiteViewSummary::WINDOW - 1)->toDateString())
        ->and(end($daily)['date'])->toBe(now()->toDateString());
});

// The reason the fill exists: a chart handed only the days that have rows
// compresses time, so a dead week reads as a busy one.
it('reports zeroes for days with no traffic rather than omitting them', function () use ($summary) {
    SiteView::create(['date' => now()->subDays(3), 'page' => 'home', 'views' => 40]);

    $daily = collect($summary()['daily'])->keyBy('date');

    expect($daily[now()->subDays(3)->toDateString()])
        ->toMatchArray(['views' => 40, 'pages' => ['home' => 40, 'about' => 0]])
        ->and($daily[now()->subDays(2)->toDateString()])
        ->toMatchArray(['views' => 0, 'pages' => ['home' => 0, 'about' => 0]]);
});

it('splits each day by page and totals across them', function () use ($summary) {
    SiteView::create(['date' => now(), 'page' => 'home', 'views' => 90]);
    SiteView::create(['date' => now(), 'page' => 'about', 'views' => 38]);

    expect(collect($summary()['daily'])->last())
        ->toMatchArray(['views' => 128, 'pages' => ['home' => 90, 'about' => 38]]);
});

// A route dropped from CountView::COUNTED still has history in the table. Its
// views are in the day's total, so they have to stay in the split too —
// otherwise the segments no longer add up to the bar.
it('keeps pages that are no longer counted', function () use ($summary) {
    SiteView::create(['date' => now(), 'page' => 'pricing', 'views' => 7]);

    expect(collect($summary()['daily'])->last())
        ->toMatchArray(['views' => 7])
        ->and(collect($summary()['daily'])->last()['pages'])
        ->toHaveKey('pricing', 7);
});

it('excludes days older than the window', function () use ($summary) {
    SiteView::create(['date' => now()->subDays(SiteViewSummary::WINDOW), 'page' => 'home', 'views' => 500]);

    expect(collect($summary()['daily'])->sum('views'))->toBe(0)
        // Still counted in the all-time figure — the window bounds the chart,
        // not the totals.
        ->and($summary()['total'])->toBe(500);
});
