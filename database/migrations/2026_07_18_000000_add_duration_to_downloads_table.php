<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('downloads', function (Blueprint $table) {
            // YtDlp::probe() has always returned this — the controller just
            // dropped it on the floor. Persisting it is what lets the UI show
            // a runtime instead of inventing one.
            //
            // Seconds, not an interval: yt-dlp reports a float, every consumer
            // wants "mm:ss", and rounding at write time keeps that formatting
            // decision in one place. Nullable because some sources (live
            // streams, the occasional X post) genuinely have no duration.
            $table->unsignedInteger('duration')->nullable()->after('source_thumbnail');
        });
    }

    public function down(): void
    {
        Schema::table('downloads', function (Blueprint $table) {
            $table->dropColumn('duration');
        });
    }
};
