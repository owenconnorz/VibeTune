import { NextResponse } from "next/server"
import { getHomeFeed } from "@/lib/innertube"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 300
export const maxDuration = 20

const FALLBACK_DATA = {
  sections: [
    {
      title: "Quick picks",
      items: [],
      type: "list",
      continuation: null,
      query: "trending music 2024",
    },
    {
      title: "Popular Music",
      items: [],
      type: "carousel",
      continuation: null,
      query: "popular music 2024",
    },
    {
      title: "Feel Good",
      items: [],
      type: "carousel",
      continuation: null,
      query: "feel good music",
    },
  ],
}

export async function GET() {
  try {
    console.log("[v0] Home API: Starting request")

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Home feed request timeout")), 18000)
    })

    const homeFeed = (await Promise.race([getHomeFeed(), timeoutPromise])) as any

    console.log("[v0] Home API: Feed received, sections:", homeFeed?.sections?.length || 0)

    if (homeFeed?.sections && homeFeed.sections.length > 0) {
      const sectionsWithItems = homeFeed.sections.filter((s: any) => s.items && s.items.length > 0)

      if (sectionsWithItems.length > 0) {
        console.log("[v0] Home API: Returning", sectionsWithItems.length, "sections with items")
        return NextResponse.json(
          { sections: sectionsWithItems },
          {
            headers: {
              "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
            },
          },
        )
      }
    }

    console.log("[v0] Home API: No valid sections, returning fallback data")
    return NextResponse.json(FALLBACK_DATA, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    })
  } catch (error: any) {
    console.error("[v0] Home API error:", error.message)

    return NextResponse.json(FALLBACK_DATA, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    })
  }
}
