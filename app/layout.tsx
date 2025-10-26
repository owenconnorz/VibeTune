import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { MusicPlayerProvider } from "@/components/music-player-provider"
import { SWRProvider } from "@/components/swr-provider"
import { PWARegister } from "@/components/pwa-register"
import { DownloadManagerProvider } from "@/components/download-manager-provider"
import { StoragePermissionInitializer } from "@/components/storage-permission-initializer"
import { CookieConsentBanner } from "@/components/cookie-consent-banner"
import { AuthProvider } from "@/components/auth-provider"
import { Analytics } from "@/components/analytics" // Import Analytics component
import { OfflineIndicator } from "@/components/offline-indicator"
import { MiniPlayer } from "@/components/mini-player" // Declare MiniPlayer component
import { NotificationPermissionPrompt } from "@/components/notification-permission-prompt"
import { ThemeProvider } from "@/components/theme-provider" // Declare ThemeProvider component
import { CastProvider } from "@/components/cast-provider" // Import CastProvider for global Cast SDK initialization
import "./globals.css"

const geistSans = Geist({ subsets: ["latin"] })
const geistMono = Geist_Mono({ subsets: ["latin"] })

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#22c55e",
}

export const metadata: Metadata = {
  title: "OpenTune - Music Discovery",
  description: "Discover and explore music with OpenTune",
  generator: "v0.app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "OpenTune",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon-192.jpg", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.jpg", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.jpg", sizes: "180x180", type: "image/png" }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="OpenTune" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <SWRProvider>
              <CastProvider>
                <DownloadManagerProvider>
                  <MusicPlayerProvider>
                    <OfflineIndicator />
                    <NotificationPermissionPrompt />
                    {children}
                    <MiniPlayer />
                  </MusicPlayerProvider>
                </DownloadManagerProvider>
              </CastProvider>
            </SWRProvider>
          </AuthProvider>
          <PWARegister />
        </ThemeProvider>
        <StoragePermissionInitializer />
        <CookieConsentBanner />
        {typeof window !== "undefined" && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                try {
                  // Analytics will load if available
                  window.Analytics.load();
                } catch (e) {
                  console.log('[v0] Analytics not available');
                }
              `,
            }}
          />
        )}
        <Analytics />
      </body>
    </html>
  )
}
