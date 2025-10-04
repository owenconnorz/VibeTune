import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import "./global-styles.css"
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
      </body>
    </html>
  )
}