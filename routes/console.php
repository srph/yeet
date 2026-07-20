<?php

use App\Jobs\CheckCookieHealth;
use Illuminate\Support\Facades\Schedule;

// Deletes expired objects so the bucket stops growing forever, and flips
// their rows to status 'expired'.
Schedule::command('downloads:prune')->hourly()->withoutOverlapping();

// A real YouTube metadata probe: cheap enough to run weekly, plus admins can
// queue an immediate check from the dashboard.
Schedule::job(new CheckCookieHealth)
    ->weeklyOn(1, '03:00')
    ->withoutOverlapping();
