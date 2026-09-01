<?php

use App\Models\User;

it('renders document titles as page - Yeet so Inertia Head does not flash', function (string $path, string $title) {
    $this->get($path)
        ->assertOk()
        ->assertSee("<title inertia>{$title}</title>", false);
})->with([
    ['/', 'Video Downloader - Yeet'],
    ['/about', 'About - Yeet'],
    ['/login', 'Login - Yeet'],
]);

it('renders the dashboard title as Control Panel - Yeet', function () {
    $this->actingAs(User::factory()->create())
        ->get('/dashboard')
        ->assertOk()
        ->assertSee('<title inertia>Control Panel - Yeet</title>', false);
});
