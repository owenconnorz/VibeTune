import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { AudioPlayerProvider } from "@/contexts/audio-player-context"
import { AuthProvider } from "@/contexts/auth-context"
import { SyncProvider } from "@/contexts/sync-context"
import { ThemeProvider } from "@/contexts/theme-context"
import { PlaylistProvider } from "@/contexts/playlist-context"
import { ListeningHistoryProvider } from "@/contexts/listening-history-context"
import { UpdateProvider } from "@/contexts/update-context"
import { LikedSongsProvider } from "@/contexts/liked-songs-context"
import { RefreshProvider } from "@/contexts/refresh-context"
import { SettingsProvider } from "@/contexts/settings-context"
import { DownloadProvider } from "@/contexts/download-context"
import { ServiceWorkerRegistration } from "@/components/service-worker-registration"
import { DiscordRPCIntegration } from "@/components/discord-rpc-integration"
import { AgeVerificationModal } from "@/components/age-verification-modal"
import "./globals.css"

export const metadata: Metadata = {
  title: "VibeTune Music App",
  description: "A modern music streaming app with unlimited access to your favorite songs",
  generator: "v0.app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VibeTune",
  },
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

const CombinedProviders = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <SyncProvider>
      <ListeningHistoryProvider>
        <AudioPlayerProvider>
          <PlaylistProvider>
            <LikedSongsProvider>
              <DownloadProvider>
                <ThemeProvider>
                  <RefreshProvider>
                    <UpdateProvider>
                      <SettingsProvider>
                        <DiscordRPCIntegration />
                        <AgeVerificationModal />
                        {children}
                      </SettingsProvider>
                    </UpdateProvider>
                  </RefreshProvider>
                </ThemeProvider>
              </DownloadProvider>
            </LikedSongsProvider>
          </PlaylistProvider>
        </AudioPlayerProvider>
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
        <meta name="theme-color" content="#f97316" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="VibeTune" />
        <meta
          name="permissions-policy"
          content="microphone=(), camera=(), geolocation=(), notifications=(self), persistent-storage=(self), background-sync=(self)"
        />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
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
        <ServiceWorkerRegistration />
        <CombinedProviders>{children}</CombinedProviders>
      </body>
    </html>
  )
}
