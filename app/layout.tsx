import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import { ClientLayout } from "./client-layout"

export const metadata: Metadata = {
  title: "VibeTune Music App",
  description: "A modern music streaming app with unlimited access to your favorite songs",
  generator: "v0.app",
  manifest: "/manifest.json",
  viewport: "width=device-width, initial-scale=1.0, viewport-fit=cover",
  themeColor: "#f97316",
  appleWebApp: {
    capable: true,
    statusBarStyle: "blackTranslucent",
    title: "VibeTune",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-touch-fullscreen": "yes",
    "color-scheme": "dark light",
    "supported-color-schemes": "dark light",
    "permissions-policy":
      "microphone=(), camera=(), geolocation=(), notifications=(self), persistent-storage=(self), background-sync=(self), accelerometer=(self), gyroscope=(self)",
  },
  icons: [
    {
      rel: "apple-touch-icon",
      url: "/icon-192.png",
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "192x192",
      url: "/icon-192.png",
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "512x512",
      url: "/icon-512.png",
    },
  ],
  openGraph: {
    type: "website",
    siteName: "VibeTune",
    title: "VibeTune Music App",
    description: "A modern music streaming app with unlimited access to your favorite songs",
  },
  twitter: {
    card: "summary",
    title: "VibeTune Music App",
    description: "A modern music streaming app with unlimited access to your favorite songs",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
      <body>
        <ClientLayout>{children}</ClientLayout>
        <style jsx global>{`
          html {
            font-family: ${GeistSans.style.fontFamily};
            --font-sans: ${GeistSans.variable};
            --font-mono: ${GeistMono.variable};
          }
          * {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-rendering: optimizeLegibility;
          }
          body {
            overscroll-behavior: none;
            -webkit-overflow-scrolling: touch;
          }
          video, canvas {
            transform: translateZ(0);
            will-change: transform;
            backface-visibility: hidden;
            -webkit-backface-visibility: hidden;
          }
          .video-optimized {
            contain: layout style paint;
            transform: translateZ(0);
            will-change: transform, opacity;
          }
          .page-content {
            padding-top: 5rem;
            padding-bottom: 10rem;
            min-height: 100vh;
            min-height: 100dvh;
          }
          .fixed-navigation {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 50;
          }
          .fixed-miniplayer {
            position: fixed;
            bottom: 5rem;
            left: 1rem;
            right: 1rem;
            z-index: 60;
          }
          .miniplayer-container {
            position: fixed !important;
            bottom: 5rem !important;
            left: 1rem !important;
            right: 1rem !important;
            z-index: 60 !important;
            pointer-events: none;
          }
          .miniplayer-container > * {
            pointer-events: auto;
          }
        `}</style>
      </body>
    </html>
  )
}