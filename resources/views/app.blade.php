<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
    <meta name="theme-color" content="#000000">

    {{-- Server-rendered fallback. Inertia's <Head> runs client-side only (no
         SSR), so without this a crawler that doesn't execute JS would see a
         titleless page — a regression from Next.js, which server-rendered its
         metadata export. The client overrides this once React mounts. --}}
    <title inertia>Yeet - Video Downloader</title>

    <meta name="description" content="Fast and easy way to download videos from YouTube, X and Facebook">
    <meta name="keywords" content="youtube, x, twitter, facebook, download, video, converter">
    <meta name="application-name" content="Yeet">

    <meta property="og:title" content="Yeet - Video Downloader">
    <meta property="og:description" content="Fast and easy way to download videos from YouTube, X and Facebook">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Yeet">
    <meta property="og:url" content="{{ url('/') }}">
    <meta property="og:image" content="{{ url('/og-image.png') }}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="Yeet">

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Yeet - Video Downloader">
    <meta name="twitter:description" content="Fast and easy way to download videos from YouTube, X and Facebook">
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
<body class="font-sans tracking-tighter">
    @inertia
</body>
</html>
