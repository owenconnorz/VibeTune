import { type NextRequest, NextResponse } from "next/server"
import { createYouTubeMusicAPI } from "@/lib/youtube-music-api"
import { fallbackTrendingMusic } from "@/lib/fallback-data"
import { musicCache, getCacheKey } from "@/lib/music-cache"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const maxResults = Number.parseInt(searchParams.get("maxResults") || "20")

    // Check cache first
    const cacheKey = getCacheKey.trending()
    const cachedData = musicCache.get(cacheKey)

    if (cachedData) {
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

    const youtubeAPI = createYouTubeMusicAPI()
    const results = await youtubeAPI.getTrending(maxResults)

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
    console.error("Music trending API error:", error)

    // Return fallback data on error
    const maxResults = Number.parseInt(new URL(request.url).searchParams.get("maxResults") || "20")
    const fallbackData = fallbackTrendingMusic.slice(0, maxResults)

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
