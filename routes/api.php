<?php

use App\Http\Controllers\DownloadController;
use Illuminate\Support\Facades\Route;

// Same URLs the Next.js app served, so the frontend's fetch calls are unchanged.
//
// The old app had no rate limiting at all — anyone could drive unbounded S3
// writes and download compute. That mattered less on someone else's serverless
// bill; it matters now that we own the box.
Route::post('/download', [DownloadController::class, 'store'])
    ->middleware('throttle:10,1');

// The 1s polling target. Route-model binding gives a real 404 for a missing
// row, where the old app's findFirstOrThrow fell into a generic catch and 500'd.
Route::get('/download/{download}', [DownloadController::class, 'show']);
