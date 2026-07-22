<?php

namespace App\Http\Controllers;

use App\Jobs\CheckCookieHealth;
use App\Models\CookieHealthCheck;
use App\Models\Download;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $downloads = Download::query()
            ->latest()
            ->limit(50)
            ->get([
                'id',
                'source',
                'source_url',
                'source_title',
                'format',
                'status',
                'reason',
                'duration',
                'fulfilled_at',
                'created_at',
                // Needed for the download_url accessor; $hidden, so not in JSON.
                'storage_key',
            ]);

        return Inertia::render('dashboard/dashboard', [
            'downloads' => $downloads,
            'cookieHealth' => CookieHealthCheck::query()->latest('checked_at')->first(),
        ]);
    }

    public function checkCookies(): RedirectResponse
    {
        CheckCookieHealth::dispatch();

        return back()->with('success', 'Cookie healthcheck queued.');
    }
}
