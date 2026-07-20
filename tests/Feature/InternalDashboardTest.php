<?php

use App\Jobs\CheckCookieHealth;
use App\Models\CookieHealthCheck;
use App\Models\User;
use App\Services\CookieHealthInspector;
use Illuminate\Support\Facades\Queue;
use Inertia\Testing\AssertableInertia as Assert;
use Laravel\Socialite\Contracts\Provider;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use SocialiteProviders\Discord\Provider as DiscordProvider;

it('protects the internal dashboard', function () {
    $this->get('/dashboard')->assertRedirect('/login');
});

it('registers the Discord Socialite provider', function () {
    expect(Socialite::driver('discord'))->toBeInstanceOf(DiscordProvider::class);
});

it('starts Discord login through Socialite', function () {
    config([
        'services.discord.client_id' => 'client-id',
        'services.discord.client_secret' => 'secret',
        'services.discord.redirect' => 'https://yeet.test/auth/discord/callback',
    ]);

    $provider = Mockery::mock(Provider::class);
    $provider->shouldReceive('redirect')
        ->once()
        ->andReturn(redirect()->away('https://discord.com/oauth2/authorize'));
    Socialite::shouldReceive('driver')->once()->with('discord')->andReturn($provider);

    $this->get('/auth/discord')
        ->assertRedirect('https://discord.com/oauth2/authorize');
});

it('logs in an allowlisted Discord user', function () {
    config([
        'auth.discord_admin_ids' => ['123'],
        'services.discord.client_id' => 'client-id',
        'services.discord.client_secret' => 'secret',
        'services.discord.redirect' => 'https://yeet.test/auth/discord/callback',
    ]);

    $discord = SocialiteUser::fake([
        'id' => '123',
        'nickname' => 'operator',
        'name' => 'operator',
        'global_name' => 'Yeet Operator',
        'email' => 'operator@example.com',
        'verified' => true,
        'avatar' => 'https://cdn.discordapp.com/avatar.webp',
    ]);
    $provider = Mockery::mock(Provider::class);
    $provider->shouldReceive('user')->once()->andReturn($discord);
    Socialite::shouldReceive('driver')->once()->with('discord')->andReturn($provider);

    $this->get('/auth/discord/callback')
        ->assertRedirect('/dashboard');

    $this->assertAuthenticated();
    expect(User::first())
        ->discord_id->toBe('123')
        ->discord_handle->toBe('operator')
        ->discord_avatar->toBe('https://cdn.discordapp.com/avatar.webp')
        ->name->toBe('Yeet Operator');
});

it('rejects a Discord user outside the allowlist', function () {
    config([
        'auth.discord_admin_ids' => ['allowed-id'],
        'services.discord.client_id' => 'client-id',
        'services.discord.client_secret' => 'secret',
        'services.discord.redirect' => 'https://yeet.test/auth/discord/callback',
    ]);

    $discord = SocialiteUser::fake([
        'id' => 'other-id',
        'name' => 'visitor',
        'email' => 'visitor@example.com',
    ]);
    $provider = Mockery::mock(Provider::class);
    $provider->shouldReceive('user')->once()->andReturn($discord);
    Socialite::shouldReceive('driver')->once()->with('discord')->andReturn($provider);

    $this->get('/auth/discord/callback')
        ->assertRedirect('/login')
        ->assertSessionHas('error', 'This Discord account is not allowed.');

    $this->assertGuest();
    expect(User::count())->toBe(0);
});

it('shows the dashboard and queues a manual cookie check', function () {
    Queue::fake();
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard/dashboard', false)
            ->has('downloads')
            ->where('cookieHealth', null));

    $this->actingAs($user)
        ->post('/dashboard/cookie-health')
        ->assertRedirect()
        ->assertSessionHas('success', 'Cookie healthcheck queued.');

    Queue::assertPushed(CheckCookieHealth::class);
});

it('records a successful cookie healthcheck', function () {
    $this->mock(CookieHealthInspector::class, function ($mock) {
        $mock->shouldReceive('fileIdentity')->once()->andReturn([
            'file_modified_at' => now()->subDay(),
            'cookie_file_fingerprint' => str_repeat('a', 64),
        ]);
        $mock->shouldReceive('inspect')->once()->andReturn([
            'cookie_count' => 12,
            'session_cookie' => '__Secure-3PSID',
            'session_expires_at' => now()->addMonth(),
            'probe_title' => 'Never Gonna Give You Up',
        ]);
    });

    (new CheckCookieHealth)->handle(app(CookieHealthInspector::class));

    expect(CookieHealthCheck::first())
        ->status->toBe('healthy')
        ->cookie_count->toBe(12)
        ->cookie_file_fingerprint->toBe(str_repeat('a', 64));
});
