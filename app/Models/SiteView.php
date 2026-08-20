<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class SiteView extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            // SQLite hands integers back as strings often enough that the
            // dashboard prop would ship a string to React without this.
            'views' => 'integer',
        ];
    }

    /**
     * A hand-rolled mutator rather than the 'date' cast, because the cast
     * writes through getDateFormat() — 'Y-m-d H:i:s' — so an Eloquent save
     * would store '2026-08-01 00:00:00' in a date column while CountView's
     * query-builder upsert stores '2026-08-01'. On Postgres the column type
     * hides that; on SQLite (the test driver) it's dynamically typed, so the
     * two writers would disagree about what today's row is keyed on.
     *
     * Storing 'Y-m-d' from every write path is also what lets `min(date)`
     * come back in the exact shape the frontend parses.
     */
    protected function date(): Attribute
    {
        return Attribute::make(
            get: fn (string $value) => Carbon::parse($value)->startOfDay(),
            set: fn ($value) => Carbon::parse($value)->toDateString(),
        );
    }
}
