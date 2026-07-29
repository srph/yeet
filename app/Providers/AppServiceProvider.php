<?php

namespace App\Providers;

use App\Services\DouyinCookies;
use App\Sources\DouyinSource;
use App\Sources\FacebookSource;
use App\Sources\SourceResolver;
use App\Sources\TikTokSource;
use App\Sources\XSource;
use App\Sources\YouTubeSource;
use App\Sources\YtDlp;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use SocialiteProviders\Discord\Provider as DiscordProvider;
use SocialiteProviders\Manager\SocialiteWasCalled;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(DouyinCookies::class, fn () => new DouyinCookies(
            config('services.ytdlp.douyin_cookies'),
        ));

        // The source registry. Adding a source is one class and one line here.
        // Order only matters if two adapters could claim the same URL — they
        // can't today, but keep the most specific first as a habit.
        //
        // Constructor args are the price of each adapter owning its own
        // yt-dlp flags; a source with nothing to get past stays a bare `new`.
        $this->app->singleton(SourceResolver::class, fn ($app) => new SourceResolver([
            new YouTubeSource(config('services.ytdlp.cookies') ?: null),
            new XSource,
            new FacebookSource,
            new TikTokSource,
            new DouyinSource($app->make(DouyinCookies::class)),
        ]));

        $this->app->singleton(YtDlp::class, fn ($app) => new YtDlp(
            config('services.ytdlp.binary'),
            $app->make(SourceResolver::class),
        ));
    }

    public function boot(): void
    {
        Event::listen(function (SocialiteWasCalled $event): void {
            $event->extendSocialite('discord', DiscordProvider::class);
        });

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
