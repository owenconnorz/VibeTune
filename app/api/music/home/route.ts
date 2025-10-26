import { NextResponse } from "next/server"
import { getMusicHomeFeed } from "@/lib/innertube"

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
    console.log("[v0] ===== HOME API REQUEST =====")
    console.log("[v0] Fetching YouTube Music home feed...")

    let homeFeed
    try {
      homeFeed = await getMusicHomeFeed()
    } catch (innerError: any) {
      console.error("[v0] getMusicHomeFeed threw error:", innerError?.message)
      console.error("[v0] Stack:", innerError?.stack)
      homeFeed = { sections: [] }
    }

    const sections = homeFeed?.sections || []

    console.log("[v0] Home feed returned", sections.length, "sections")

    if (sections.length === 0) {
      console.log("[v0] No sections returned, using fallback data")
      return NextResponse.json(FALLBACK_DATA, {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      })
    }

    console.log("[v0] ===== HOME API SUCCESS =====")
    console.log("[v0] Sections:", sections.map((s: any) => s.title).join(", "))
    console.log(
      "[v0] Total items:",
      sections.reduce((sum: number, s: any) => sum + (s.items?.length || 0), 0),
    )

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
