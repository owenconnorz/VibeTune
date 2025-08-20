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
      return NextResponse.json({
        videos: fallbackTrendingMusic.slice(0, maxResults),
        source: "fallback",
      })
    }

    console.log("[v0] Using YouTube API to fetch trending music")
    const youtube = createYouTubeAPI(apiKey)
    const videos = await youtube.getTrendingMusic(maxResults)
    console.log("[v0] YouTube API returned:", videos?.length || 0, "trending videos")

    return NextResponse.json({ videos, source: "youtube" })
  } catch (error) {
    console.error("[v0] Trending API error:", error)
    console.log("[v0] API error, falling back to mock data")
    const maxResults = 20 // Declare maxResults variable here
    return NextResponse.json({
      videos: fallbackTrendingMusic.slice(0, maxResults),
      source: "fallback_error",
    })
  }
}
