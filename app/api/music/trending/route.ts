import { type NextRequest, NextResponse } from "next/server"
import { createYouTubeAPI } from "@/lib/youtube-api"
import { fallbackTrendingMusic } from "@/lib/fallback-data"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const maxResults = Number.parseInt(searchParams.get("maxResults") || "20")

    const apiKey = process.env.YOUTUBE_API_KEY

    if (!apiKey) {
      console.log("[v0] YouTube API key not configured, using fallback data")
      return NextResponse.json({ videos: fallbackTrendingMusic })
    }

    const youtube = createYouTubeAPI(apiKey)
    const videos = await youtube.getTrendingMusic(maxResults)

    return NextResponse.json({ videos })
  } catch (error) {
    console.error("Trending API error:", error)
    console.log("[v0] API error, falling back to mock data")
    return NextResponse.json({ videos: fallbackTrendingMusic })
  }
}
