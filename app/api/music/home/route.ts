import { NextResponse } from "next/server"
import { getMusicHomeFeed } from "@/lib/innertube"

export const dynamic = "force-dynamic"

// Simple fallback data that requires no API calls
const FALLBACK_DATA = {
  sections: [
    {
      title: "Quick Start",
      items: [
        {
          id: "dQw4w9WgXcQ",
          title: "Never Gonna Give You Up",
          artist: "Rick Astley",
          thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
          duration: "3:33",
          type: "song",
          aspectRatio: "square",
        },
        {
          id: "9bZkp7q19f0",
          title: "Gangnam Style",
          artist: "PSY",
          thumbnail: "https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg",
          duration: "4:13",
          type: "song",
          aspectRatio: "square",
        },
      ],
      type: "carousel" as const,
      continuation: null,
    },
  ],
}

export async function GET() {
  try {
    console.log("[v0] ===== HOME API REQUEST =====")

    console.log("[v0] Fetching YouTube Music home feed...")

    const fetchWithTimeout = Promise.race([
      getMusicHomeFeed(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Home feed timeout")), 10000)),
    ])

    const homeFeed = await fetchWithTimeout.catch((error: any) => {
      console.error("[v0] getMusicHomeFeed error:", error?.message || "Unknown error")
      return { sections: [] }
    })

    const sections = homeFeed.sections || []
    console.log("[v0] Home feed sections:", sections.length)

    if (sections.length === 0) {
      console.log("[v0] No sections available, using fallback data")
      return NextResponse.json(FALLBACK_DATA, {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      })
    }

    console.log("[v0] ===== HOME API SUCCESS =====")
    console.log("[v0] Total sections:", sections.length)

    return NextResponse.json(
      { sections },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    )
  } catch (error: any) {
    console.error("[v0] ===== HOME API ERROR =====")
    console.error("[v0] Error:", error?.message || "Unknown error")
    console.error("[v0] Stack:", error?.stack || "No stack trace")

    return NextResponse.json(FALLBACK_DATA, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    })
  }
}
