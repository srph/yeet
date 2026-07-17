<?php

use App\Jobs\ProcessDownload;
use App\Models\Download;
use App\Sources\YtDlp;
use Illuminate\Support\Facades\Queue;

beforeEach(function () {
    Queue::fake();

    // Never shell out to yt-dlp in tests.
    $this->mock(YtDlp::class, fn ($m) => $m->shouldReceive('probe')->andReturn([
        'title' => 'Never Gonna Give You Up',
        'thumbnail' => 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        'duration' => 213.0,
    ]));
});

$post = fn (array $payload) => test()->postJson('/api/download', $payload);

it('creates a download and dispatches the job', function () use ($post) {
    $response = $post(['url' => 'https://youtu.be/dQw4w9WgXcQ', 'format' => 'mp4']);

    // 201: Laravel maps a freshly-created model returned from a controller to
    // "Created" automatically. A dedupe hit returns 200 instead. The frontend
    // only checks response.ok, so both are fine there.
    $response->assertCreated()
        ->assertJsonPath('source', 'youtube')
        ->assertJsonPath('source_id', 'dQw4w9WgXcQ')
        ->assertJsonPath('status', 'queued');

    Queue::assertPushed(ProcessDownload::class);
    expect(Download::count())->toBe(1);
});

it('returns every key the frontend zod schema requires', function () use ($post) {
    // Regression: Download::create() returns a model holding only the
    // attributes it set, so the response omitted the untouched nullable
    // columns. zod's .nullable() still requires the KEY to exist, so the
    // frontend threw on the very first submit.
    $response = $post(['url' => 'https://youtu.be/dQw4w9WgXcQ', 'format' => 'mp4']);

    $response->assertJsonStructure([
        'id', 'source', 'source_url', 'source_id', 'source_title',
        'source_thumbnail', 'format', 'status', 'download_url',
        'storage_file_name', 'reason', 'expires_at', 'created_at', 'updated_at',
    ]);
});

it('never exposes the storage key', function () use ($post) {
    $post(['url' => 'https://youtu.be/dQw4w9WgXcQ', 'format' => 'mp4'])
        ->assertJsonMissingPath('storage_key');
});

it('reuses an existing row instead of downloading twice', function () use ($post) {
    // THE regression test for the dedupe bug: the old app queried `expiredAt`,
    // a column nothing ever wrote, so this branch was dead and every submit
    // re-downloaded and re-uploaded the same video.
    $first = $post(['url' => 'https://youtu.be/dQw4w9WgXcQ', 'format' => 'mp4']);
    $second = $post(['url' => 'https://youtu.be/dQw4w9WgXcQ', 'format' => 'mp4']);

    expect($second->json('id'))->toBe($first->json('id'));
    expect(Download::count())->toBe(1);
    Queue::assertPushed(ProcessDownload::class, 1); // NOT 2
});

it('treats each format as its own download', function () use ($post) {
    $post(['url' => 'https://youtu.be/dQw4w9WgXcQ', 'format' => 'mp4']);
    $post(['url' => 'https://youtu.be/dQw4w9WgXcQ', 'format' => 'mp3']);

    expect(Download::count())->toBe(2);
});

it('re-downloads rather than returning a terminal row', function (string $status) use ($post) {
    // failed/expired rows are useless: one has no file, the other's file was
    // deleted by prune. Both must fall through to a fresh download.
    Download::factory()->create(['status' => $status]);

    $response = $post(['url' => 'https://youtu.be/dQw4w9WgXcQ', 'format' => 'mp4']);

    expect($response->json('status'))->toBe('queued');
    expect(Download::count())->toBe(2);
})->with(['failed', 'expired']);

it('rejects an unsupported url with 422', function () use ($post) {
    // The old app threw an invariant here, which fell into a generic catch
    // and returned a 500.
    $post(['url' => 'https://vimeo.com/12345', 'format' => 'mp4'])
        ->assertStatus(422)
        ->assertJsonValidationErrorFor('url');

    Queue::assertNothingPushed();
});

it('validates the format', function () use ($post) {
    $post(['url' => 'https://youtu.be/dQw4w9WgXcQ', 'format' => 'avi'])
        ->assertStatus(422)
        ->assertJsonValidationErrorFor('format');
});

it('404s for a missing download', function () {
    // The old app's findFirstOrThrow landed in a generic catch and 500'd.
    test()->getJson('/api/download/01aaaaaaaaaaaaaaaaaaaaaaaa')->assertNotFound();
});

it('shows an existing download', function () {
    $download = Download::factory()->create();

    test()->getJson("/api/download/{$download->id}")
        ->assertOk()
        ->assertJsonPath('id', $download->id);
});
