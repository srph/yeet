<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CookieHealthCheck extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'session_expires_at' => 'datetime',
            'file_modified_at' => 'datetime',
            'checked_at' => 'datetime',
        ];
    }
}
