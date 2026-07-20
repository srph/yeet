<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cookie_health_checks', function (Blueprint $table) {
            $table->string('cookie_file_fingerprint', 64)->nullable()->after('file_modified_at');
        });
    }

    public function down(): void
    {
        Schema::table('cookie_health_checks', function (Blueprint $table) {
            $table->dropColumn('cookie_file_fingerprint');
        });
    }
};
