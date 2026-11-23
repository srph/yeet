<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DiscordAuthController;
use App\Models\Download;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Inertia is only rendering the view — no props. All data flows through
// React Query against /api/download, exactly as it did under Next.js.
Route::get('/', fn () => Inertia::render('home'))->name('home');
// A download's shareable address. Same page as /, opened on the tracking
// screen. The row rides along as a prop so a cold load paints tracking on the
// first frame instead of flashing the form while React Query fetches it.
// Submitting from / gets here with a client-side router.push, not a request —
// this route only answers cold loads. A missing ID is a plain 404.
Route::get('/d/{download}', fn (Download $download) => Inertia::render('home', [
    'download' => $download,
]))->name('download');

Route::get('/about', fn () => Inertia::render('about'))->name('about');

Route::middleware('guest')->group(function () {
    Route::get('/login', fn () => Inertia::render('dashboard/dashboard-login'))->name('login');
    Route::get('/auth/discord', [DiscordAuthController::class, 'redirect'])
        ->name('auth.discord.redirect');
    Route::get('/auth/discord/callback', [DiscordAuthController::class, 'callback'])
        ->name('auth.discord.callback');
});

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::post('/dashboard/cookie-health', [DashboardController::class, 'checkCookies'])
        ->name('dashboard.cookie-health');
    Route::post('/logout', [DiscordAuthController::class, 'logout'])->name('logout');
});
