<?php

namespace App\Exceptions;

use RuntimeException;

/** yt-dlp couldn't read metadata for a URL (private, deleted, geo-blocked, bot-checked). */
class SourceUnavailable extends RuntimeException {}
