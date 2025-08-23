import { type NextRequest, NextResponse } from "next/server"
import { createAdvancedYouTubeAPI } from "@/lib/youtube-api-advanced"
import { networkStrategyManager } from "@/lib/network-strategy"
import { fallbackTrendingMusic } from "@/lib/fallback-data"
import { musicCache, getCacheKey } from "@/lib/music-cache"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const maxResults = Number.parseInt(searchParams.get("maxResults") || "20")
    const regionCode = searchParams.get("region") || "US"

    console.log("[v0] Trending API called with maxResults:", maxResults, "region:", regionCode)
    console.log("[v0] Using Advanced YouTube API")

    const cacheKey = getCacheKey.trending()
    const cachedData = musicCache.get(cacheKey)

    if (cachedData) {
      console.log("[v0] Returning cached data, length:", cachedData.length)
      return NextResponse.json({
        videos: cachedData.slice(0, maxResults),
        source: "cache",
      })
    }

    const apiKey = process.env.YOUTUBE_API_KEY
    if (!apiKey) {
      throw new Error("YouTube API key not configured")
    }

    const networkConditions = networkStrategyManager.getCurrentNetworkConditions()
    console.log("[v0] Network conditions:", networkConditions)

    const youtubeAPI = createAdvancedYouTubeAPI(apiKey, {
      highQuality: false,
      preferVideos: false,
      showVideos: false,
      highQualityAudio: networkConditions.type === "wifi",
      preferOpus: true,
      adaptiveAudio: true,
    })

    console.log("[v0] Calling getTrending...")
    const results = await youtubeAPI.getTrending(regionCode)

    console.log("[v0] YouTube API response received")
    console.log("[v0] Videos returned:", results?.length || 0)
    if (results && results.length > 0) {
      console.log("[v0] First video sample:", {
        title: results[0]?.title,
        artist: results[0]?.artist,
        thumbnail: results[0]?.thumbnail,
        id: results[0]?.id,
      })
    }

    if (results && results.length > 0) {
      const videos = results.map((item) => ({
        id: item.id,
        title: item.title,
        channelTitle: item.artist,
        thumbnail: item.thumbnail,
        duration: item.duration,
        publishedAt: item.publishedAt,
        viewCount: item.viewCount || 0,
      }))

      musicCache.set(cacheKey, videos, 30 * 60 * 1000)
      console.log("[v0] Returning YouTube API data, source: youtube_advanced")
      return NextResponse.json({
        videos: videos.slice(0, maxResults),
        source: "youtube_advanced",
        networkType: networkConditions.type,
      })
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
