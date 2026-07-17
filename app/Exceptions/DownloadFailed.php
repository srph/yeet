<?php

namespace App\Exceptions;

use RuntimeException;

/** yt-dlp recognized the URL but couldn't produce a file. */
class DownloadFailed extends RuntimeException {}
