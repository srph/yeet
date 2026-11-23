<?php

use App\Models\Download;
use App\Models\SiteView;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('increments one row per page per day', function () {
    $this->get('/')->assertOk();
    $this->get('/')->assertOk();
    $this->get('/about')->assertOk();

    // Two pages, one day: two rows. The repeat visit incremented rather than
    // inserted — that's the upsert's conflict target doing its job.
    expect(SiteView::count())->toBe(2);
    expect(SiteView::where('page', 'home')->first()->views)->toBe(2);
    expect(SiteView::where('page', 'about')->first()->views)->toBe(1);
});

it('counts every shareable download address as one page', function () {
    $downloads = Download::factory()->count(2)->create();

    $this->get("/d/{$downloads[0]->id}")->assertOk();
    $this->get("/d/{$downloads[1]->id}")->assertOk();
    $this->get('/d/01jdx3k8m2q7v9r4t6w0y5zabc')->assertNotFound();

    // Keyed by route name, so two different IDs share one row, and the 404
    // isn't a view at all.
    expect(SiteView::count())->toBe(1);
    expect(SiteView::where('page', 'download')->first()->views)->toBe(2);
});

it('ignores everything that is not a page view', function () {
    // withHeader() sets a *default* header that otherwise leaks into every
    // later request in the test, so each one is flushed before the next.
    $this->withHeader('Sec-Purpose', 'prefetch')->get('/');
    $this->flushHeaders();

    $this->withHeader('X-Inertia-Partial-Data', 'cookieHealth')->get('/');
    $this->flushHeaders();

    $this->withHeader('User-Agent', 'Googlebot/2.1')->get('/');
    $this->flushHeaders();

    $this->withHeader('User-Agent', 'facebookexternalhit/1.1')->get('/');
    $this->flushHeaders();

    $this->post('/api/download', ['url' => 'https://youtu.be/x', 'format' => 'mp3']);
    $this->get('/api/download/missing');

    expect(SiteView::count())->toBe(0);
});

it('does not count the operator visiting the public site', function () {
    $this->actingAs(User::factory()->create())->get('/')->assertOk();

    expect(SiteView::count())->toBe(0);
});

it('does not count the dashboard measuring itself', function () {
    $this->actingAs(User::factory()->create())->get('/dashboard')->assertOk();

    expect(SiteView::count())->toBe(0);
});

it('wires the summary into the dashboard', function () {
    SiteView::create(['date' => now()->startOfMonth(), 'page' => 'home', 'views' => 30]);

    $this->actingAs(User::factory()->create())
        ->get('/dashboard')
        ->assertInertia(fn (Assert $page) => $page->where('analytics.total', 30));
});
