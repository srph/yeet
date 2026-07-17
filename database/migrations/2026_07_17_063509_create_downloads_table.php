<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('downloads', function (Blueprint $table) {
            $table->ulid('id')->primary();

            // Source-agnostic: `source` discriminates, and the old youtube*
            // columns are now source*. yt-dlp handles every source, so adding
            // one means a new Source adapter — not a schema change.
            $table->string('source');
            $table->text('source_url');
            $table->string('source_id');
            $table->text('source_title');
            $table->text('source_thumbnail')->nullable(); // X posts often have none

            $table->string('format');
            $table->string('status')->default('queued');

            // Durable S3 key — NOT a presigned URL. The old app stored the
            // presigned URL, which started decaying the moment it was written
            // (a 1hr link against a 7-day expires_at). We presign on read.
            $table->string('storage_key')->nullable();
            $table->string('storage_file_name')->nullable();
            $table->text('reason')->nullable();

            // The ONLY reader of this column is downloads:prune, asking
            // "what's due for deletion?". Nothing else branches on it.
            // There is no expired_at — expiry is a status, not a timestamp.
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index(['created_at']);

            // Backs the dedupe lookup, which was broken in the old app.
            $table->index(['source', 'source_id', 'format', 'status']);

            // Backs the prune command's "what's due?" query.
            $table->index(['status', 'expires_at']);

            // No CHECK constraints on status/format: they'd be rigid this
            // early, while the set of sources, formats and states is still
            // moving. Values are validated where they enter the system.
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('downloads');
    }
};
