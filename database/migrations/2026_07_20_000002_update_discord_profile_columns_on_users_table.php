<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->renameColumn('avatar_url', 'discord_avatar');
            $table->string('discord_handle')->nullable()->after('discord_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('discord_handle');
            $table->renameColumn('discord_avatar', 'avatar_url');
        });
    }
};
