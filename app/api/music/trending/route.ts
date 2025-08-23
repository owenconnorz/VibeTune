import { type NextRequest, NextResponse } from "next/server"
import { createAdvancedYouTubeAPI } from "@/lib/youtube-api-advanced"
import { fallbackTrendingMusic } from "@/lib/fallback-data"
import { musicCache, getCacheKey } from "@/lib/music-cache"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const maxResults = Number.parseInt(searchParams.get("maxResults") || "20")
    const regionCode = searchParams.get("region") || "US"

    console.log("[v0] Music trending API called with maxResults:", maxResults, "region:", regionCode)

    // Check cache first
    const cacheKey = getCacheKey.trending()
    const cachedData = musicCache.get(cacheKey)

    if (cachedData) {
      console.log("[v0] Returning cached trending data, length:", cachedData.length)
      return NextResponse.json({
        songs: cachedData.slice(0, maxResults),
        videos: cachedData.slice(0, maxResults),
        source: "cache",
      })
    }

    // Get API key
    const apiKey = process.env.YOUTUBE_API_KEY
    if (!apiKey) {
      console.error("[v0] YouTube API key not configured")
      throw new Error("YouTube API key not configured")
    }

    // Create YouTube API client
    const youtubeAPI = createAdvancedYouTubeAPI(apiKey, {
      highQuality: false,
      preferVideos: false,
      showVideos: false,
      highQualityAudio: true,
      preferOpus: true,
      adaptiveAudio: true,
    })

    console.log("[v0] Calling YouTube API getTrending...")
    const results = await youtubeAPI.getTrending(regionCode)

    console.log("[v0] YouTube API trending response received")
    console.log("[v0] Videos returned:", results?.length || 0)

    if (results && results.length > 0) {
      console.log("[v0] First video sample:", {
        title: results[0]?.title,
        artist: results[0]?.artist,
        thumbnail: results[0]?.thumbnail,
        id: results[0]?.id,
      })

      const songs = results.map((item) => ({
        id: item.id,
        title: item.title,
        artist: item.artist,
        thumbnail: item.thumbnail,
        duration: item.duration,
        channelTitle: item.artist, // Keep for backward compatibility
        publishedAt: item.publishedAt,
        viewCount: item.viewCount || 0,
      }))

      // Cache the results
      musicCache.set(cacheKey, songs, 30 * 60 * 1000) // 30 minutes

      console.log("[v0] Returning YouTube API trending data")
      return NextResponse.json({
        songs: songs.slice(0, maxResults),
        videos: songs.slice(0, maxResults),
        source: "youtube_api",
      })
    }

    // Fallback to static data
    console.log("[v0] No YouTube trending data received, using fallback data")
    const fallbackData = fallbackTrendingMusic.slice(0, maxResults)
    return NextResponse.json({
      songs: fallbackData,
      videos: fallbackData,
      source: "fallback",
    })
  } catch (error) {
    console.error("[v0] Music trending API error:", {
      message: error.message,
      stack: error.stack,
    })

    // Return fallback data on error
    const maxResults = Number.parseInt(new URL(request.url).searchParams.get("maxResults") || "20")
    const fallbackData = fallbackTrendingMusic.slice(0, maxResults)

    console.log("[v0] Returning error fallback data")
    return NextResponse.json({
      songs: fallbackData,
      videos: fallbackData,
      source: "error_fallback",
      error: error.message,
    })
  }
}
