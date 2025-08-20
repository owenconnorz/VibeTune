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

    console.log("[v0] Using Innertube API to fetch trending music")
    const youtube = createYouTubeAPI()
    const videos = await youtube.getTrendingMusic(maxResults)
    console.log("[v0] Innertube API returned:", videos?.length || 0, "trending videos")

    if (videos && videos.length > 0) {
      musicCache.set(cacheKey, videos, 30 * 60 * 1000) // 30 minutes for real data
      return NextResponse.json({ videos, source: "innertube" })
    } else {
      // If no results from Innertube, use fallback
      console.log("[v0] No results from Innertube, using fallback data")
      const fallbackData = fallbackTrendingMusic.slice(0, maxResults)
      musicCache.set(cacheKey, fallbackData, 10 * 60 * 1000) // 10 minutes for fallback
      return NextResponse.json({
        videos: fallbackData,
        source: "fallback",
      })
    }
  } catch (error) {
    console.error("[v0] Trending API error:", error)
    console.log("[v0] Innertube API error, falling back to mock data")
    const maxResults = 20
    const fallbackData = fallbackTrendingMusic.slice(0, maxResults)

    const cacheKey = getCacheKey.trending()
    musicCache.set(cacheKey, fallbackData, 5 * 60 * 1000) // 5 minutes for error fallback

    return NextResponse.json({
      videos: fallbackData,
      source: "fallback_error",
    })
  }
}
