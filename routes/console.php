<?php

use Illuminate\Support\Facades\Schedule;

// Deletes expired objects so the bucket stops growing forever, and flips
// their rows to status 'expired'.
Schedule::command('downloads:prune')->hourly()->withoutOverlapping();
