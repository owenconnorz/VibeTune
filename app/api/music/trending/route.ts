import { type NextRequest, NextResponse } from "next/server"
import { createYouTubeAPI } from "@/lib/youtube-api"
import { fallbackTrendingMusic } from "@/lib/fallback-data"
import { musicCache, getCacheKey } from "@/lib/music-cache"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const maxResults = Number.parseInt(searchParams.get("maxResults") || "20")

    console.log("[v0] Trending API called with maxResults:", maxResults)
    console.log("[v0] YouTube API Key exists:", !!process.env.YOUTUBE_API_KEY)
    console.log("[v0] YouTube API Key length:", process.env.YOUTUBE_API_KEY?.length || 0)

    const cacheKey = getCacheKey.trending()
    const cachedData = musicCache.get(cacheKey)

    if (cachedData) {
      console.log("[v0] Returning cached data, length:", cachedData.length)
      return NextResponse.json({
        videos: cachedData.slice(0, maxResults),
        source: "cache",
      })
    }

    console.log("[v0] Creating YouTube API instance...")
    const youtube = createYouTubeAPI()
    console.log("[v0] Calling getTrendingMusic...")

    const videos = await youtube.getTrendingMusic(maxResults)

    console.log("[v0] YouTube API response received")
    console.log("[v0] Videos returned:", videos?.length || 0)
    if (videos && videos.length > 0) {
      console.log("[v0] First video sample:", {
        title: videos[0]?.title,
        artist: videos[0]?.artist,
        thumbnail: videos[0]?.thumbnail,
        id: videos[0]?.id,
      })
    }

    if (videos && videos.length > 0) {
      musicCache.set(cacheKey, videos, 30 * 60 * 1000)
      console.log("[v0] Returning YouTube data, source: youtube")
      return NextResponse.json({ videos, source: "youtube" })
    }

    console.log("[v0] No YouTube data received, using fallback data")
    const fallbackData = fallbackTrendingMusic.slice(0, maxResults)
    return NextResponse.json({
      videos: fallbackData,
      source: "fallback",
    })
  } catch (error) {
    console.error("[v0] Trending API error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })

    const maxResults = Number.parseInt(new URL(request.url).searchParams.get("maxResults") || "20")
    const fallbackData = fallbackTrendingMusic.slice(0, maxResults)

    console.log("[v0] Returning error fallback data")
    return NextResponse.json({
      videos: fallbackData,
      source: "error_fallback",
    })
  }
}
