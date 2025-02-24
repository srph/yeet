import type { Metadata } from "next";
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
  keywords: ["youtube", "download", "video", "converter"],
  authors: [{ name: "Yeet" }],
  openGraph: {
    title: "Yeet - YouTube Downloader",
    description: "Fast and easy way to download videos from YouTube",
    type: "website",
    siteName: "Yeet",
    images: [
      {
        url: "/og-image.jpg", // add your OG image
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
