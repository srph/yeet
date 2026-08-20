<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // One row per page per day. Deliberately NOT a stored running total: a
        // counter row is updated by every single page view, which serialises
        // writers on one row and leaves nothing to recompute from if it ever
        // drifts. Summing these rows is sub-millisecond at any traffic this app
        // will see, and keeps the daily series for free.
        //
        // Two rows a day is ~730 a year, ~44 KB. No prune command needed, now
        // or ever — which is the other half of why this isn't a hit log.
        Schema::create('site_views', function (Blueprint $table) {
            $table->id();

            $table->date('date');

            // The route NAME ('home', 'about'), not the path. Renaming a route
            // is a deliberate act that moves CountView::COUNTED with it, where
            // changing a URL would silently start a new series under a new key
            // and split the history in two.
            $table->string('page', 32);

            // unsignedInteger tops out around 4.29 billion views for one page
            // in one day. If that ever binds, this is not the file to fix.
            $table->unsignedInteger('views')->default(0);

            $table->timestamps();

            // The conflict target of the counting upsert. This index is what
            // turns "increment today's row for this page" into a single atomic
            // statement instead of a select-then-update race.
            $table->unique(['date', 'page']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site_views');
    }
};
