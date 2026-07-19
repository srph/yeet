<?php

namespace App\Providers;

use App\Sources\DouyinSource;
use App\Sources\FacebookSource;
use App\Sources\SourceResolver;
use App\Sources\TikTokSource;
use App\Sources\XSource;
use App\Sources\YouTubeSource;
use App\Sources\YtDlp;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(YtDlp::class, fn () => new YtDlp(
            config('services.ytdlp.binary'),
            config('services.ytdlp.cookies') ?: null,
        ));

        // The source registry. Adding a source is one class and one line here.
        // Order only matters if two adapters could claim the same URL — they
        // can't today, but keep the most specific first as a habit.
        $this->app->singleton(SourceResolver::class, fn () => new SourceResolver([
            new YouTubeSource,
            new XSource,
            new FacebookSource,
            new TikTokSource,
            new DouyinSource,
        ]));
    }

    public function boot(): void
    {
        // POST /api/download — short burst + daily ceiling, both per IP.
        RateLimiter::for('downloads', function (Request $request) {
            $ip = $request->ip();

            return [
                Limit::perMinute(config('services.downloads.throttle_per_minute'))
                    ->by($ip),
                Limit::perDay(config('services.downloads.throttle_per_day'))
                    ->by($ip),
            ];
        });
    }
}
