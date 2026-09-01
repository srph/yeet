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

    <meta name="description" content="Fast and easy way to download videos from YouTube, X, Facebook, TikTok and Douyin">
    <meta name="keywords" content="youtube, x, twitter, facebook, tiktok, douyin, download, video, converter">
    <meta name="application-name" content="Yeet">

    <meta property="og:title" content="Video Downloader - Yeet">
    <meta property="og:description" content="Fast and easy way to download videos from YouTube, X, Facebook, TikTok and Douyin">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Yeet">
    <meta property="og:url" content="{{ url('/') }}">
    <meta property="og:image" content="{{ url('/og-image.png') }}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="Yeet">

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Video Downloader - Yeet">
    <meta name="twitter:description" content="Fast and easy way to download videos from YouTube, X, Facebook, TikTok and Douyin">
    <meta name="twitter:image" content="{{ url('/og-image.png') }}">

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
