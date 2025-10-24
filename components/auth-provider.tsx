"use client"

import { SessionProvider } from "next-auth/react"
import type { ReactNode } from "react"

export function AuthProvider({ children }: { children: ReactNode }) {
  // This prevents NextAuth from making any fetch requests that would fail
  const hasAuthCredentials = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || typeof window === "undefined" // Always render on server to avoid hydration mismatch

  // On client side, if no auth credentials, just return children without SessionProvider
  if (typeof window !== "undefined" && !hasAuthCredentials) {
    return <>{children}</>
  }

  // On server or when credentials exist, use SessionProvider
  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      {children}
    </SessionProvider>
  )
}
