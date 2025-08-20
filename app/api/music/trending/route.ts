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
      return NextResponse.json({
        videos: cachedData.slice(0, maxResults),
        source: "cache",
      })
    }

    const youtube = createYouTubeAPI()
    const videos = await youtube.getTrendingMusic(maxResults)

    if (videos && videos.length > 0) {
      musicCache.set(cacheKey, videos, 30 * 60 * 1000)
      return NextResponse.json({ videos, source: "youtube" })
    }

    const fallbackData = fallbackTrendingMusic.slice(0, maxResults)
    return NextResponse.json({
      videos: fallbackData,
      source: "fallback",
    })
  } catch (error) {
    console.error("Trending API error:", error)

    const maxResults = Number.parseInt(new URL(request.url).searchParams.get("maxResults") || "20")
    const fallbackData = fallbackTrendingMusic.slice(0, maxResults)

    return NextResponse.json({
      videos: fallbackData,
      source: "error_fallback",
    })
  }
}
