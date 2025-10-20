import { NextResponse } from "next/server"
import { getHomeFeed, searchMusic, type HomeFeedSection } from "@/lib/innertube"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function generateFallbackHomeFeed(): Promise<{ sections: HomeFeedSection[] }> {
  console.log("[v0] Generating fallback home feed using search...")

  const categories = [
    { title: "Popular Music", query: "popular music 2024" },
    { title: "Trending Now", query: "trending songs" },
    { title: "Top Hits", query: "top hits music" },
    { title: "Chill Vibes", query: "chill music playlist" },
    { title: "Workout Energy", query: "workout music" },
  ]

  const sections: HomeFeedSection[] = []

  for (const category of categories) {
    try {
      const results = await searchMusic(category.query)
      if (results.videos.length > 0) {
        sections.push({
          title: category.title,
          items: results.videos.slice(0, 10), // Limit to 10 items per section
        })
      }
    } catch (error) {
      console.error(`[v0] Error fetching ${category.title}:`, error)
      continue
    }
  }

  console.log("[v0] Generated", sections.length, "fallback sections")
  return { sections }
}

export async function GET() {
  try {
    console.log("[v0] Fetching home feed...")
    const homeFeed = await getHomeFeed()

    if (homeFeed.sections.length === 0) {
      console.log("[v0] Home feed empty, using fallback...")
      const fallbackFeed = await generateFallbackHomeFeed()
      return NextResponse.json(fallbackFeed)
    }

    console.log("[v0] Home feed fetched successfully, sections:", homeFeed.sections.length)
    return NextResponse.json(homeFeed)
  } catch (error) {
    console.error("[v0] Error in home feed API:", error)

    try {
      console.log("[v0] Attempting fallback after error...")
      const fallbackFeed = await generateFallbackHomeFeed()
      return NextResponse.json(fallbackFeed)
    } catch (fallbackError) {
      console.error("[v0] Fallback also failed:", fallbackError)
      return NextResponse.json(
        {
          sections: [],
          error: "Failed to fetch home feed",
        },
        { status: 200 },
      )
    }
  }
}
