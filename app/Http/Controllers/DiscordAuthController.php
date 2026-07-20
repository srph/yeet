<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpFoundation\RedirectResponse as SymfonyRedirectResponse;
use Throwable;

/**
 * Discord-only login for the internal dashboard.
 *
 * Flow: /auth/discord → Discord → /auth/discord/callback → allowlist →
 * session → /dashboard. Socialite owns the OAuth dance; we only gate via
 * auth.discord_admin_ids.
 */
class DiscordAuthController extends Controller
{
    /**
     * Kick off Discord OAuth. Credentials must be set or we bounce back
     * rather than send people to a broken authorize URL.
     */
    public function redirect(): SymfonyRedirectResponse
    {
        if (! config('services.discord.client_id') || ! config('services.discord.client_secret')) {
            return to_route('login')->with('error', 'Discord login is not configured.');
        }

        return Socialite::driver('discord')->redirect();
    }

    /**
     * OAuth callback: verify the Discord user, enforce the allowlist, then
     * upsert a local User and start a session.
     */
    public function callback(Request $request): RedirectResponse
    {
        // State/token exchange lives in Socialite — any failure here is a
        // cancelled login, expired state, or Discord outage.
        try {
            $discord = Socialite::driver('discord')->user();
        } catch (Throwable) {
            return to_route('login')->with('error', 'Discord could not verify your account.');
        }

        $discordId = (string) $discord->getId();
        $allowedIds = config('auth.discord_admin_ids', []);

        // Fail closed: empty allowlist means nobody gets in.
        if ($discordId === '' || ! in_array($discordId, $allowedIds, true)) {
            return to_route('login')->with('error', 'This Discord account is not allowed.');
        }

        // Scope includes email; we still refuse if Discord withholds it.
        $email = $discord->getEmail();

        if (! is_string($email) || $email === '') {
            return to_route('login')->with('error', 'Discord did not return an email address.');
        }

        $raw = $discord->getRaw();
        $user = User::firstOrNew(['discord_id' => $discordId]);
        $user->fill([
            'discord_handle' => $discord->getNickname(),
            'discord_avatar' => $discord->getAvatar(),
            // Prefer the display name Discord shows in the client.
            'name' => $raw['global_name'] ?? $discord->getName() ?? $discord->getNickname() ?? 'Discord user',
            'email' => $email,
            'email_verified_at' => ($raw['verified'] ?? false) ? now() : null,
        ]);

        // Users table still requires a password column; Discord is the only
        // login path, so invent an unusable random hash on first create.
        if (! $user->exists) {
            $user->password = Str::random(64);
        }

        $user->save();
        Auth::login($user);
        $request->session()->regenerate();

        return to_route('dashboard');
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return to_route('login');
    }
}
