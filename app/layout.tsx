import type { Metadata, Viewport } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "Yeet - YouTube Downloader",
  description: "Fast and easy way to download videos from YouTube",
  icons: {
    icon: [{ url: "/favicon.svg" }],
    shortcut: ["/favicon.svg"],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.json",
  applicationName: "Yeet",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Yeet",
  },
  keywords: ["youtube", "download", "video", "converter"],
  authors: [{ name: "Yeet" }],
  openGraph: {
    title: "Yeet - YouTube Downloader",
    description: "Fast and easy way to download videos from YouTube",
    type: "website",
    siteName: "Yeet",
    images: [
      {
        url: "/og-image.png", // add your OG image
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Yeet - YouTube Downloader",
    description: "Fast and easy way to download videos from YouTube",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} ${playfair.variable} font-sans tracking-tighter`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
