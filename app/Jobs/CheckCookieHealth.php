<?php

namespace App\Jobs;

use App\Models\CookieHealthCheck;
use App\Services\CookieHealthInspector;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

class CheckCookieHealth implements ShouldBeUnique, ShouldQueue
{
    use Queueable;

    public int $uniqueFor = 1800;

    public function __construct()
    {
        $this->onQueue('downloads');
    }

    public function handle(CookieHealthInspector $inspector): void
    {
        $identity = [
            'file_modified_at' => null,
            'cookie_file_fingerprint' => null,
        ];

        try {
            $identity = $inspector->fileIdentity();
            $result = $inspector->inspect();

            CookieHealthCheck::create([
                ...$identity,
                ...$result,
                'status' => 'healthy',
                'message' => 'Cookie session and live YouTube probe passed.',
                'checked_at' => now(),
            ]);
        } catch (Throwable $exception) {
            Log::warning('ytdlp.cookies.healthcheck.failed', [
                'exception' => $exception::class,
                'message' => $exception->getMessage(),
            ]);

            CookieHealthCheck::create([
                ...$identity,
                'status' => 'unhealthy',
                'message' => $exception->getMessage(),
                'checked_at' => now(),
            ]);
        }
    }
}
