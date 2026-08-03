<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('downloads', function (Blueprint $table) {
            // ProcessDownload has always computed this — filesize() on the
            // scratch file, right before upload — and only ever logged it.
            // Persisting it is what lets the rail show a real size instead of
            // omitting the row the design asked for.
            //
            // Named to sit with storage_key and storage_file_name: this is a
            // fact about the stored object, not about the source media, and
            // the storage_* prefix is what already marks that distinction.
            //
            // Bytes, not a formatted string: formatting is a display concern
            // and belongs in one place on the frontend. The unit lives in this
            // comment rather than the name, same as duration's seconds.
            //
            // bigInteger, not integer — unsigned 32-bit caps at 4.29GB, and a
            // long 1080p mp4 clears that. Silently truncating the size of the
            // exact files most worth showing a size for is the worst outcome.
            //
            // Nullable because rows that completed before this column existed
            // have no honest value, and because a failed stat() must record
            // "unknown" rather than a misleading 0.
            $table->unsignedBigInteger('storage_file_size')->nullable()->after('storage_file_name');
        });
    }

    public function down(): void
    {
        Schema::table('downloads', function (Blueprint $table) {
            $table->dropColumn('storage_file_size');
        });
    }
};
