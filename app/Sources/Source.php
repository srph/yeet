<?php

namespace App\Sources;

interface Source
{
    /** The value stored in the `source` column: 'youtube' | 'x' | 'facebook' | 'tiktok' | 'douyin'. */
    public function key(): string;

    /**
     * The stable per-source identifier, used for the storage key and the
     * (source, source_id, format) dedupe lookup. Null if this adapter
     * doesn't recognize the URL.
     */
    public function extractId(string $url): ?string;
}
