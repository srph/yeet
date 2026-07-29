<?php

namespace App\Console\Commands;

use App\Services\DouyinCookies;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Throwable;

/**
 * Writes the Douyin cookie jar. Run once per machine — local after cloning
 * (`composer setup` does it for you), once on the server after deploying.
 *
 * Unlike the YouTube jar there's no browser export and no account: the ttwid
 * ByteDance returns identifies a browser, not a person, so this can mint its
 * own. See DouyinCookies for why Douyin needs it at all.
 *
 * Existing jars are left alone. The cookie's own expiry is a year out, so
 * re-minting is for when Douyin starts refusing it, not routine upkeep.
 */
#[Signature('ytdlp:douyin {--force : Replace an existing jar} {--graceful : Exit 0 even on failure, for composer setup}')]
#[Description('Mint the Douyin cookie jar (ttwid) used by yt-dlp')]
class DouyinCookiesCommand extends Command
{
    public function handle(DouyinCookies $cookies): int
    {
        $path = $cookies->path();

        if ($cookies->exists() && ! $this->option('force')) {
            $this->line("Douyin cookies already exist: {$path}");
            $this->line('  minted:  '.$cookies->modifiedAt()?->diffForHumans());
            $this->line('  cookies: '.implode(', ', $cookies->names()));
            $this->newLine();
            $this->line('Pass --force to replace them.');

            return self::SUCCESS;
        }

        try {
            $cookies->mint();
        } catch (Throwable $e) {
            $this->error('Could not mint Douyin cookies.');
            $this->error('  '.$e->getMessage());

            // composer setup must not fail on a network hiccup; the jar stays
            // missing and Douyin downloads throw until someone reruns this.
            return $this->option('graceful') ? self::SUCCESS : self::FAILURE;
        }

        $this->info("Douyin cookies written: {$path}");
        $this->line('  cookies: '.implode(', ', $cookies->names()));

        return self::SUCCESS;
    }
}
