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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
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
                      <UpdateProvider>{children}</UpdateProvider>
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
