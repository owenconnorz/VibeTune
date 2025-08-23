import { type NextRequest, NextResponse } from "next/server"
import { createAdvancedYouTubeAPI } from "@/lib/youtube-api-advanced"
import { fallbackSearchResults } from "@/lib/fallback-data"
import { musicCache, getCacheKey } from "@/lib/music-cache"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const maxResults = Number.parseInt(searchParams.get("maxResults") || "20")

    console.log("[v0] Music search API called with query:", query)

    if (!query) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
    }

    // Check cache first
    const cacheKey = getCacheKey.search(query)
    const cachedData = musicCache.get(cacheKey)

    if (cachedData) {
      console.log("[v0] Returning cached search results for:", query)
      return NextResponse.json({
        songs: cachedData.slice(0, maxResults),
        videos: cachedData.slice(0, maxResults),
        source: "cache",
        query,
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

    console.log("[v0] Calling YouTube API search...")
    const results = await youtubeAPI.search(query, "music")

    console.log("[v0] YouTube API search results:", {
      hasResults: !!results,
      resultCount: results?.length || 0,
      firstResultTitle: results?.[0]?.title || "none",
    })

    if (results && results.length > 0) {
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
      musicCache.set(cacheKey, songs, 20 * 60 * 1000) // 20 minutes

      console.log("[v0] Returning YouTube API search results for:", query)
      return NextResponse.json({
        songs: songs.slice(0, maxResults),
        videos: songs.slice(0, maxResults),
        source: "youtube_api",
        query,
      })
    }

    // Fallback to static data
    console.log("[v0] No YouTube results, using fallback data for:", query)
    const queryLower = query.toLowerCase()
    const fallbackResults = fallbackSearchResults[queryLower] || fallbackSearchResults.default || []

    return NextResponse.json({
      songs: fallbackResults.slice(0, maxResults),
      videos: fallbackResults.slice(0, maxResults),
      source: "fallback",
      query,
    })
  } catch (error) {
    console.error("[v0] Music search API error:", {
      message: error.message,
      stack: error.stack,
    })

    // Return fallback data on error
    const query = new URL(request.url).searchParams.get("q") || ""
    const maxResults = Number.parseInt(new URL(request.url).searchParams.get("maxResults") || "20")
    const queryLower = query.toLowerCase()
    const fallbackResults = fallbackSearchResults[queryLower] || fallbackSearchResults.default || []

    console.log("[v0] Returning error fallback data for:", query)
    return NextResponse.json({
      songs: fallbackResults.slice(0, maxResults),
      videos: fallbackResults.slice(0, maxResults),
      source: "error_fallback",
      query,
      error: error.message,
    })
  }
}
