.PHONY: install start

# Everything the app shells out to. yt-dlp and ffmpeg aren't installed by
# composer or npm, so a missing one would otherwise only surface as a failed
# download.
REQUIRED := php composer npm yt-dlp ffmpeg

# Safe to re-run: .env and APP_KEY are only created when missing, so an
# existing key (and the sessions encrypted with it) survives.
install:
	@for bin in $(REQUIRED); do \
		command -v $$bin >/dev/null || { echo "Missing $$bin — see Requirements in README.md"; exit 1; }; \
	done
	composer install
	npm install
	@test -f .env || cp .env.example .env
	@grep -Eq '^APP_KEY=.+' .env || php artisan key:generate
	php artisan migrate
	php artisan ytdlp:douyin --graceful

# Server, downloads queue, logs and vite together — see `dev` in composer.json.
start:
	composer dev
