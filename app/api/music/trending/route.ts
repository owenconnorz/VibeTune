import { type NextRequest, NextResponse } from "next/server"
import { createYouTubeMusicAPI } from "@/lib/youtube-music-api"
import { fallbackTrendingMusic } from "@/lib/fallback-data"
import { musicCache, getCacheKey } from "@/lib/music-cache"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const maxResults = Number.parseInt(searchParams.get("maxResults") || "20")

    console.log("[v0] Music trending API called with maxResults:", maxResults)

    // Check cache first
    const cacheKey = getCacheKey.trending()
    const cachedData = musicCache.get(cacheKey)

    if (cachedData) {
      console.log("[v0] Music trending API: Returning cached data, count:", cachedData.length)
      const response = NextResponse.json({
        songs: cachedData.slice(0, maxResults),
        videos: cachedData.slice(0, maxResults),
        source: "cache",
      })

      response.headers.set("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=3600")
      response.headers.set("CDN-Cache-Control", "public, s-maxage=1800")
      response.headers.set("Vercel-CDN-Cache-Control", "public, s-maxage=1800")

      return response
    }

    console.log("[v0] Music trending API: No cache found, calling YouTube API")

    const apiKey = process.env.YOUTUBE_API_KEY
    console.log("[v0] Music trending API: API key exists:", !!apiKey)
    console.log("[v0] Music trending API: API key length:", apiKey?.length || 0)

    const youtubeAPI = createYouTubeMusicAPI()
    console.log("[v0] Music trending API: YouTube API instance created")

    const results = await youtubeAPI.getTrending(maxResults)
    console.log("[v0] Music trending API: YouTube API results:", {
      hasVideos: !!results.videos,
      videoCount: results.videos?.length || 0,
      firstVideoTitle: results.videos?.[0]?.title || "none",
    })

    if (results.videos && results.videos.length > 0) {
      const songs = results.videos.map((item) => ({
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
      console.log("[v0] Music trending API: Cached fresh YouTube data, count:", songs.length)

      const response = NextResponse.json({
        songs: songs.slice(0, maxResults),
        videos: songs.slice(0, maxResults),
        source: "youtube_api",
      })

      response.headers.set("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=3600")
      response.headers.set("CDN-Cache-Control", "public, s-maxage=1800")
      response.headers.set("Vercel-CDN-Cache-Control", "public, s-maxage=1800")

      return response
    }

    // Fallback to static data
    console.log("[v0] Music trending API: No YouTube results, using fallback data")
    const fallbackData = fallbackTrendingMusic.slice(0, maxResults)

    const response = NextResponse.json({
      songs: fallbackData,
      videos: fallbackData,
      source: "fallback",
    })

    response.headers.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=7200")
    response.headers.set("CDN-Cache-Control", "public, s-maxage=3600")
    response.headers.set("Vercel-CDN-Cache-Control", "public, s-maxage=3600")

    return response
  } catch (error) {
    console.error("[v0] Music trending API error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })

    // Return fallback data on error
    const maxResults = Number.parseInt(new URL(request.url).searchParams.get("maxResults") || "20")
    const fallbackData = fallbackTrendingMusic.slice(0, maxResults)
    console.log("[v0] Music trending API: Error occurred, returning fallback data, count:", fallbackData.length)

    const response = NextResponse.json({
      songs: fallbackData,
      videos: fallbackData,
      source: "error_fallback",
      error: error.message,
    })

    response.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600")
    response.headers.set("CDN-Cache-Control", "public, s-maxage=300")
    response.headers.set("Vercel-CDN-Cache-Control", "public, s-maxage=300")

    return response
  }
}
