import { NextResponse } from "next/server"
import { getHomeFeed } from "@/lib/youtube-api"

export const dynamic = "force-dynamic"
export const revalidate = 300

const FALLBACK_DATA = {
  sections: [
    {
      title: "Trending Music",
      items: [],
      type: "carousel" as const,
      continuation: null,
    },
    {
      title: "Popular Tracks",
      items: [],
      type: "carousel" as const,
      continuation: null,
    },
  ],
}

export async function GET() {
  try {
    console.log("[v0] Home API: Starting YouTube Data API home feed request")

    const homeFeed = await getHomeFeed()

    if (!homeFeed.sections || homeFeed.sections.length === 0) {
      console.log("[v0] Home API: No sections returned, using fallback")
      return NextResponse.json(FALLBACK_DATA, {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      })
    }

    const sections = homeFeed.sections.map((section) => ({
      title: section.title,
      items: section.items,
      type: "carousel" as const,
      continuation: null,
    }))

    console.log("[v0] Home API: Successfully fetched", sections.length, "sections")

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
    console.error("[v0] Home API error:", error?.message || "Unknown error")
    console.error("[v0] Home API stack:", error?.stack || "No stack trace")

    return NextResponse.json(FALLBACK_DATA, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    })
  }
}
