import { type NextRequest, NextResponse } from "next/server"
import { createYouTubeAPI } from "@/lib/youtube-api"

export const runtime = "edge"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const maxResults = Number.parseInt(searchParams.get("maxResults") || "20")

    const youtubeAPI = createYouTubeAPI(process.env.YOUTUBE_API_KEY)
    const results = await youtubeAPI.getTrendingMusic(maxResults)

    return NextResponse.json(results, {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
      },
    })
  } catch (error) {
    console.error("[v0] YouTube trending API error:", error)
    return NextResponse.json({ error: "Failed to fetch trending music" }, { status: 500 })
  }
}
