<?php

namespace App\Providers;

use App\Sources\DouyinSource;
use App\Sources\FacebookSource;
use App\Sources\SourceResolver;
use App\Sources\TikTokSource;
use App\Sources\XSource;
use App\Sources\YouTubeSource;
use App\Sources\YtDlp;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(YtDlp::class, fn () => new YtDlp(
            config('services.ytdlp.binary'),
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
        //
    }
}
