<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Inertia is only rendering the view — no props. All data flows through
// React Query against /api/download, exactly as it did under Next.js.
Route::get('/', fn () => Inertia::render('Home'))->name('home');
