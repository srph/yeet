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
