import { type NextRequest, NextResponse } from "next/server"
import { createYouTubeAPI } from "@/lib/youtube-api"
import { fallbackTrendingMusic } from "@/lib/fallback-data"
import { musicCache, getCacheKey } from "@/lib/music-cache"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const maxResults = Number.parseInt(searchParams.get("maxResults") || "20")

    const cacheKey = getCacheKey.trending()
    const cachedData = musicCache.get(cacheKey)

    if (cachedData) {
      console.log("[v0] Returning cached trending music data")
      return NextResponse.json({
        videos: cachedData.slice(0, maxResults),
        source: "cache",
      })
    }

    const apiKey = process.env.YOUTUBE_API_KEY

    if (!apiKey) {
      console.log("[v0] YouTube API key not configured, using fallback data")
      const fallbackData = fallbackTrendingMusic.slice(0, maxResults)
      musicCache.set(cacheKey, fallbackData, 5 * 60 * 1000) // 5 minutes for fallback
      return NextResponse.json({
        videos: fallbackData,
        source: "fallback",
      })
    }

    console.log("[v0] Using YouTube API to fetch trending music")
    const youtube = createYouTubeAPI(apiKey)
    const videos = await youtube.getTrendingMusic(maxResults)
    console.log("[v0] YouTube API returned:", videos?.length || 0, "trending videos")

    if (videos && videos.length > 0) {
      musicCache.set(cacheKey, videos, 30 * 60 * 1000) // 30 minutes for real data
    }

    return NextResponse.json({ videos, source: "youtube" })
  } catch (error) {
    console.error("[v0] Trending API error:", error)
    console.log("[v0] API error, falling back to mock data")
    const maxResults = 20
    const fallbackData = fallbackTrendingMusic.slice(0, maxResults)

    const cacheKey = getCacheKey.trending()
    musicCache.set(cacheKey, fallbackData, 2 * 60 * 1000) // 2 minutes for error fallback

    return NextResponse.json({
      videos: fallbackData,
      source: "fallback_error",
    })
  }
}
