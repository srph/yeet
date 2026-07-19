<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('downloads', function (Blueprint $table) {
            // When the job settles — complete or failed. Distinct from
            // updated_at (bumps on every processing attempt) and from
            // duration (media length). Queue wait + cook = fulfilled_at
            // minus created_at.
            $table->timestamp('fulfilled_at')->nullable()->after('expires_at');
        });
    }

    public function down(): void
    {
        Schema::table('downloads', function (Blueprint $table) {
            $table->dropColumn('fulfilled_at');
        });
    }
};
