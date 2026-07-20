<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cookie_health_checks', function (Blueprint $table) {
            $table->id();
            $table->string('status');
            $table->text('message');
            $table->unsignedInteger('cookie_count')->default(0);
            $table->string('session_cookie')->nullable();
            $table->timestamp('session_expires_at')->nullable();
            $table->timestamp('file_modified_at')->nullable();
            $table->string('probe_title')->nullable();
            $table->timestamp('checked_at');
            $table->timestamps();

            $table->index('checked_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cookie_health_checks');
    }
};
