"use client"

import { useEffect } from "react"

export function Analytics() {
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const { Analytics } = await import("@vercel/analytics/react")
        console.log("[v0] Analytics loaded successfully")
      } catch (error) {
        console.log("[v0] Analytics not available (this is fine for development)")
      }
    }

    loadAnalytics()
  }, [])

  return null
}
