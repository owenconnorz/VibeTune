import { type NextRequest, NextResponse } from "next/server"
import { createYouTubeAPI } from "@/lib/youtube-api"

export const runtime = "edge"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const maxResults = Number.parseInt(searchParams.get("maxResults") || "20")
    const pageToken = searchParams.get("pageToken") || undefined

    if (!query) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
    }

    const youtubeAPI = createYouTubeAPI(process.env.YOUTUBE_API_KEY)
    const results = await youtubeAPI.searchMusicEnhanced(query, maxResults, pageToken)

    return NextResponse.json(results, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    })
  } catch (error) {
    console.error("[v0] YouTube enhanced search API error:", error)
    return NextResponse.json({ error: "Failed to perform enhanced search" }, { status: 500 })
  }
}
