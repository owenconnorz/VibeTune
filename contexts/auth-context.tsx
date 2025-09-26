"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

export interface User {
  id: string
  email: string
  name: string
  picture: string
  accessToken: string
  refreshToken: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  refreshAccessToken: () => Promise<string | null>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check for existing session on mount
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      }
    } catch (error) {
      console.error("Error checking auth status:", error)
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    try {
      setError(null)
      setLoading(true)

      console.log("[v0] Initiating Google sign-in...")

      const response = await fetch("/api/auth/google", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      })

      console.log("[v0] Auth endpoint response status:", response.status)

      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch {
          errorData = { error: "Network error occurred" }
        }

        console.error("[v0] Auth endpoint error:", errorData)

        if (errorData.error === "Google OAuth not configured") {
          setError(
            "Google OAuth is not configured. Please contact the administrator to set up GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.",
          )
          setLoading(false)
          return
        }
        throw new Error(errorData.error || "Authentication failed")
      }

      // If we get here, the OAuth endpoint returned a redirect
      // This means the credentials are configured, so we can proceed
      console.log("[v0] Redirecting to Google OAuth...")
      window.location.href = "/api/auth/google"
    } catch (error) {
      console.error("[v0] Error signing in with Google:", error)
      setError(error instanceof Error ? error.message : "Failed to sign in with Google")
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setError(null)
      await fetch("/api/auth/logout", { method: "POST" })
      setUser(null)
    } catch (error) {
      console.error("Error signing out:", error)
      setError("Failed to sign out")
    }
  }

  const refreshAccessToken = async (): Promise<string | null> => {
    try {
      const response = await fetch("/api/auth/refresh", { method: "POST" })
      if (response.ok) {
        const data = await response.json()
        if (user) {
          setUser({ ...user, accessToken: data.accessToken })
        }
        return data.accessToken
      }
      return null
    } catch (error) {
      console.error("Error refreshing token:", error)
      return null
    }
  }

  const clearError = () => {
    setError(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signInWithGoogle,
        signOut,
        refreshAccessToken,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
