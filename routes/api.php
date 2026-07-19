<?php

use App\Http\Controllers\DownloadController;
use Illuminate\Support\Facades\Route;

// Same URLs the Next.js app served, so the frontend's fetch calls are unchanged.
//
// Burst + daily caps live in the named `downloads` RateLimiter
// (AppServiceProvider). Defaults: 10/min and 50/day per IP.
Route::post('/download', [DownloadController::class, 'store'])
    ->middleware('throttle:downloads');

// The 1s polling target. Route-model binding gives a real 404 for a missing
// row, where the old app's findFirstOrThrow fell into a generic catch and 500'd.
Route::get('/download/{download}', [DownloadController::class, 'show']);
