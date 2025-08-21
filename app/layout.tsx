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
import { UpdateProvider } from "@/contexts/update-context"
import { LikedSongsProvider } from "@/contexts/liked-songs-context"
import "./globals.css"

export const metadata: Metadata = {
  title: "VibeTune Music App",
  description: "Your personal music streaming experience",
  generator: "v0.app",
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

const CombinedProviders = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <SyncProvider>
      <ListeningHistoryProvider>
        <DownloadProvider>
          <AudioPlayerProvider>
            <PlaylistProvider>
              <LikedSongsProvider>
                <ThemeProvider>
                  <UpdateProvider>{children}</UpdateProvider>
                </ThemeProvider>
              </LikedSongsProvider>
            </PlaylistProvider>
          </AudioPlayerProvider>
        </DownloadProvider>
      </ListeningHistoryProvider>
    </SyncProvider>
  </AuthProvider>
)

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googleapis.com" />
        <link rel="dns-prefetch" href="https://i.ytimg.com" />
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        <CombinedProviders>{children}</CombinedProviders>
      </body>
    </html>
  )
}
