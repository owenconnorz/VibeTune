"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"

interface PageRouterProps {
  children: React.ReactNode
}

export function PageRouter({ children }: PageRouterProps) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const handlePopState = () => {
      // Handle any cleanup or state updates when user navigates back/forward
      console.log("[v0] Navigation via browser back/forward to:", pathname)
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [pathname])

  useEffect(() => {
    // Update document title based on current route
    const routeTitles: Record<string, string> = {
      "/": "VibeTune Music App",
      "/explore": "Explore - VibeTune",
      "/videos": "Videos - VibeTune",
      "/library": "Library - VibeTune",
      "/search": "Search - VibeTune",
    }

    const title = routeTitles[pathname] || "VibeTune Music App"
    document.title = title
  }, [pathname])

  return <>{children}</>
}
