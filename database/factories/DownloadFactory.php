<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<\App\Models\Download> */
class DownloadFactory extends Factory
{
    public function definition(): array
    {
        return [
            'source' => 'youtube',
            'source_url' => 'https://youtu.be/dQw4w9WgXcQ',
            'source_id' => 'dQw4w9WgXcQ',
            'source_title' => 'Never Gonna Give You Up',
            'source_thumbnail' => 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
            'format' => 'mp4',
            'status' => 'queued',
        ];
    }

    public function complete(): static
    {
        return $this->state(fn () => [
            'status' => 'complete',
            'storage_key' => 'yeet/youtube/dQw4w9WgXcQ.mp4',
            'storage_file_name' => 'dQw4w9WgXcQ.mp4',
            'expires_at' => now()->addDays(7),
        ]);
    }

    /** A complete row whose window has passed — what downloads:prune looks for. */
    public function expiring(): static
    {
        return $this->complete()->state(fn () => [
            'expires_at' => now()->subHour(),
        ]);
    }
}
