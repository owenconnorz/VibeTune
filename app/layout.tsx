import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { AudioPlayerProvider } from "@/contexts/audio-player-context"
import { VideoPlayerProvider } from "@/contexts/video-player-context"
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
import { NotificationsProvider } from "@/contexts/notifications-context"
import { ServiceWorkerRegistration } from "@/components/service-worker-registration"
import { DiscordRPCIntegration } from "@/components/discord-rpc-integration"
import { AgeVerificationModal } from "@/components/age-verification-modal"
import { PageRouter } from "@/components/page-router"
import { NavigationRouter } from "@/components/navigation-router"
import { RenderOptimizationProvider } from "@/contexts/render-optimization-context"
import { VideoPlayer } from "@/components/video-player"
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
        <RenderOptimizationProvider>
          <AudioPlayerProvider>
            <VideoPlayerProvider>
              <PlaylistProvider>
                <LikedSongsProvider>
                  <DownloadProvider>
                    <ThemeProvider>
                      <RefreshProvider>
                        <UpdateProvider>
                          <SettingsProvider>
                            <NotificationsProvider>
                              <DiscordRPCIntegration />
                              <AgeVerificationModal />
                              {children}
                            </NotificationsProvider>
                          </SettingsProvider>
                        </UpdateProvider>
                      </RefreshProvider>
                    </ThemeProvider>
                  </DownloadProvider>
                </LikedSongsProvider>
              </PlaylistProvider>
            </VideoPlayerProvider>
          </AudioPlayerProvider>
        </RenderOptimizationProvider>
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <meta name="theme-color" content="#f97316" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="VibeTune" />
        <meta name="color-scheme" content="dark light" />
        <meta name="supported-color-schemes" content="dark light" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge,chrome=1" />
        <meta name="renderer" content="webkit" />
        <meta name="force-rendering" content="webkit" />
        <meta
          name="permissions-policy"
          content="microphone=(), camera=(), geolocation=(), notifications=(self), persistent-storage=(self), background-sync=(self), accelerometer=(self), gyroscope=(self)"
        />
        <link rel="preload" as="style" href="/globals.css" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="dns-prefetch" href="https://www.googleapis.com" />
        <link rel="dns-prefetch" href="https://i.ytimg.com" />
        <link rel="dns-prefetch" href="https://raw.githubusercontent.com" />
        <link rel="dns-prefetch" href="https://api.github.com" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <style>{`
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
  padding-bottom: 8rem;
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
  bottom: 6rem;
  left: 1rem;
  right: 1rem;
  z-index: 40;
}
        `}</style>
      </head>
      <body>
        <ServiceWorkerRegistration />
        <CombinedProviders>
          <PageRouter>
            {children}
            <NavigationRouter />
            <VideoPlayer />
          </PageRouter>
        </CombinedProviders>
      </body>
    </html>
  )
}
