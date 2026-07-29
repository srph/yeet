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

    /**
     * yt-dlp flags this source needs to get past whatever it puts in the way —
     * bot checks, cookie jars, headers. Empty for sources that just work.
     * Flags that apply to every source live in YtDlp, not here.
     *
     * @return list<string>
     */
    public function ytdlpArgs(): array;
}
