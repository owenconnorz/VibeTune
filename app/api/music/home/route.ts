import { NextResponse } from "next/server"
import { getTrendingMusic, getCharts } from "@/lib/innertube"

export const dynamic = "force-dynamic"
export const revalidate = 300

const FALLBACK_DATA = {
  sections: [
    {
      title: "Quick picks",
      items: [],
      type: "carousel" as const,
      continuation: null,
    },
    {
      title: "Recommended Music",
      items: [],
      type: "carousel" as const,
      continuation: null,
    },
  ],
}

export async function GET() {
  try {
    console.log("[v0] Home API: Starting YouTube Music home feed request")

    const [trending, charts] = await Promise.all([getTrendingMusic().catch(() => []), getCharts().catch(() => [])])

    console.log("[v0] Home API: Trending music:", trending.length, "items")
    console.log("[v0] Home API: Charts:", charts.length, "items")

    const sections: any[] = []

    // Add Quick picks section (trending music)
    if (trending.length > 0) {
      sections.push({
        title: "Quick picks",
        items: trending.slice(0, 20),
        type: "carousel",
        continuation: null,
      })
    }

    // Add Charts section
    if (charts.length > 0) {
      sections.push({
        title: "Top Charts",
        items: charts.slice(0, 20),
        type: "carousel",
        continuation: null,
      })
    }

    // Add more sections with different slices
    if (trending.length > 20) {
      sections.push({
        title: "Recommended Music",
        items: trending.slice(20, 40),
        type: "carousel",
        continuation: null,
      })
    }

    if (sections.length === 0) {
      console.log("[v0] Home API: No sections created, using fallback")
      return NextResponse.json(FALLBACK_DATA, {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      })
    }

    console.log("[v0] Home API: Successfully created", sections.length, "sections")

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

    // Return fallback data on error
    return NextResponse.json(FALLBACK_DATA, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    })
  }
}
