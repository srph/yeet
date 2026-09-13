<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
    <meta name="theme-color" content="#000000">

    {{-- Must already be "{page} - Yeet", same as the title callback in
         app.tsx. Inertia's <Head> only runs after mount (no SSR), so a
         different order here flashes in the tab before React can correct it. --}}
    <title inertia>{{ match ($page['component'] ?? '') {
        'home' => 'Video Downloader - Yeet',
        'about' => 'About - Yeet',
        'dashboard/dashboard-login' => 'Login - Yeet',
        'dashboard/dashboard' => 'Control Panel - Yeet',
        default => 'Yeet',
    } }}</title>

    <meta name="description" content="Fast and easy way to download videos from YouTube, Twitter, Facebook, TikTok and Douyin">
    <meta name="keywords" content="youtube, x, twitter, facebook, tiktok, douyin, download, video, converter">
    <meta name="application-name" content="Yeet">

    {{-- Facebook, Twitter and Slack cache the card by og:image URL, so a
         redesigned image keeps unfurling as the old one until something forces
         a re-scrape. The file's mtime rides along as that version — it moves
         only when the image is replaced, and a fresh clone restamping it costs
         one harmless re-fetch. --}}
    {{-- The card ships as JPEG: the foliage ground is grainy enough that q82
         costs nothing visible and saves 78% over the PNG. og-image-original.png
         beside it is the lossless master to re-encode from, not what's served. --}}
    @php
        $ogImagePath = public_path('og-image.jpg');
        $ogImage = url('/og-image.jpg').'?v='.(is_file($ogImagePath) ? filemtime($ogImagePath) : 1);
    @endphp

    <meta property="og:title" content="Video Downloader - Yeet">
    <meta property="og:description" content="Fast and easy way to download videos from YouTube, Twitter, Facebook, TikTok and Douyin">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Yeet">
    <meta property="og:url" content="{{ url('/') }}">
    <meta property="og:image" content="{{ $ogImage }}">
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="Yeet">

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Video Downloader - Yeet">
    <meta name="twitter:description" content="Fast and easy way to download videos from YouTube, Twitter, Facebook, TikTok and Douyin">
    <meta name="twitter:image" content="{{ $ogImage }}">

    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-title" content="Yeet">

    <link rel="icon" href="{{ url('/favicon.svg') }}" type="image/svg+xml">
    <link rel="shortcut icon" href="{{ url('/favicon.svg') }}">
    <link rel="apple-touch-icon" sizes="180x180" href="{{ url('/apple-icon.png') }}">
    <link rel="manifest" href="{{ url('/manifest.json') }}">

    @viteReactRefresh
    @vite(['resources/js/app.tsx'])
    @inertiaHead
</head>

{{-- Class list lifted from the old layout.tsx <body>. --}}
<body class="font-sans">
    @inertia
</body>
</html>
