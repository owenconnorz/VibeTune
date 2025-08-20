import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { AudioPlayerProvider } from "@/contexts/audio-player-context"
import { AuthProvider } from "@/contexts/auth-context"
import { SyncProvider } from "@/contexts/sync-context"
import { ThemeProvider } from "@/contexts/theme-context"
import { PlaylistProvider } from "@/contexts/playlist-context"
import { DownloadProvider } from "@/contexts/download-context"
import { ListeningHistoryProvider } from "@/contexts/listening-history-context"
import { PWAInstaller } from "@/components/pwa-installer"
import "./globals.css"

export const metadata: Metadata = {
  title: "VibeTune Music App",
  description: "Your personal music streaming experience",
  generator: "v0.app",
  manifest: "/manifest.json",
  themeColor: "#f59e0b",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VibeTune",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "VibeTune",
    title: "VibeTune Music App",
    description: "Your personal music streaming experience",
  },
  twitter: {
    card: "summary",
    title: "VibeTune Music App",
    description: "Your personal music streaming experience",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#f59e0b" />
        <meta name="background-color" content="#000000" />

        {/* Apple-specific meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="VibeTune" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />

        {/* Microsoft-specific meta tags */}
        <meta name="msapplication-TileColor" content="#f59e0b" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />

        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        <AuthProvider>
          <SyncProvider>
            <ListeningHistoryProvider>
              <AudioPlayerProvider>
                <PlaylistProvider>
                  <DownloadProvider>
                    <ThemeProvider>
                      {children}
                      <PWAInstaller />
                    </ThemeProvider>
                  </DownloadProvider>
                </PlaylistProvider>
              </AudioPlayerProvider>
            </ListeningHistoryProvider>
          </SyncProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
