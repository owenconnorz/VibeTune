import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { MusicPlayerProvider } from "@/components/music-player-provider"
import { SWRProvider } from "@/components/swr-provider"
import { PWARegister } from "@/components/pwa-register"
import { DownloadManagerProvider } from "@/components/download-manager-provider"
import { StoragePermissionInitializer } from "@/components/storage-permission-initializer"
import { CookieConsentBanner } from "@/components/cookie-consent-banner"
import { AuthProvider } from "@/components/auth-provider"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

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
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="OpenTune" />
      </head>
      <body className={`font-sans antialiased`}>
        <AuthProvider>
          <SWRProvider>
            <DownloadManagerProvider>
              <MusicPlayerProvider>{children}</MusicPlayerProvider>
            </DownloadManagerProvider>
          </SWRProvider>
        </AuthProvider>
        <PWARegister />
        <StoragePermissionInitializer />
        <CookieConsentBanner />
        <Analytics />
      </body>
    </html>
  )
}
