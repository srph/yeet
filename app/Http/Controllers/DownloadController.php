<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessDownload;
use App\Models\Download;
use App\Sources\SourceResolver;
use App\Sources\YtDlp;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class DownloadController extends Controller
{
    /**
     * POST /api/download — same URL and JSON shape the frontend already posts
     * to, so mutations.ts needs no change beyond field names.
     */
    public function store(Request $request, SourceResolver $resolver, YtDlp $ytdlp)
    {
        // Was zod. Laravel returns 422 with a comparable field-error shape.
        $data = $request->validate([
            'url' => ['required', 'url'],
            'format' => ['required', Rule::in(['mp3', 'mp4'])],
        ]);

        $resolved = $resolver->resolve($data['url']);

        // The old app threw an invariant here, which fell into a generic catch
        // and returned a 500. This is a real 422.
        if (! $resolved) {
            throw ValidationException::withMessages([
                'url' => 'That link is not from a supported site.',
            ]);
        }

        [$source, $sourceId] = $resolved;

        // Share / mix URLs often carry ?list=… — with --no-playlist yt-dlp still
        // walks youtube:tab first. Canonical watch URLs skip that hop.
        $fetchUrl = $source->key() === 'youtube'
            ? "https://www.youtube.com/watch?v={$sourceId}"
            : $data['url'];

        // THE DEDUPE FIX. The original queried `expiredAt` — a column nothing
        // ever wrote, so it was always NULL and `NULL > now()` was never true.
        // The branch was dead and every submit re-downloaded.
        //
        // Keying off status alone is what dropping expired_at buys us: a row is
        // reusable unless it's terminal-and-useless. 'queued'/'processing' means
        // someone already started this exact job — join it rather than dispatch
        // a duplicate. 'complete' means the file is in the bucket.
        $existing = Download::query()
            ->where('source', $source->key())
            ->where('source_id', $sourceId)
            ->where('format', $data['format'])
            ->whereNotIn('status', ['failed', 'expired'])
            ->first();

        // Returning the model directly — Eloquent serializes it to JSON,
        // snake_case keys and all. No resource layer.
        if ($existing) {
            return $existing;
        }

        $meta = $ytdlp->probe($fetchUrl);

        $download = Download::create([
            'source' => $source->key(),
            'source_url' => $fetchUrl,
            'source_id' => $sourceId,
            'source_title' => $meta['title'],
            'source_thumbnail' => $meta['thumbnail'],
            // probe() hands back a float; the column is whole seconds.
            'duration' => isset($meta['duration']) ? (int) round($meta['duration']) : null,
            'format' => $data['format'],
            'status' => 'queued',
        ]);

        // Was downloadYoutubeTask.trigger(...). Fire and forget, as before.
        ProcessDownload::dispatch($download)->onQueue('downloads');

        // create() leaves the model holding only the attributes we set, so it
        // would serialize without the untouched nullable columns (reason,
        // expires_at, storage_file_name) — and the frontend's zod schema
        // requires those keys to be present, nullable or not. Refreshing makes
        // this response identical in shape to show()'s.
        return $download->refresh();
    }

    /**
     * GET /api/download/{download} — the 1s polling target. Route-model
     * binding gives a real 404 where the old app 500'd.
     */
    public function show(Download $download)
    {
        return $download;
    }
}
