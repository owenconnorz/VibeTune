import { type NextRequest, NextResponse } from "next/server"
import { createYouTubeMusicAPI } from "@/lib/youtube-music-api"
import { fallbackSearchResults } from "@/lib/fallback-data"
import { musicCache, getCacheKey } from "@/lib/music-cache"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const maxResults = Number.parseInt(searchParams.get("maxResults") || "20")

    console.log("[v0] Search API called with query:", query, "maxResults:", maxResults)

    const apiKey = process.env.YOUTUBE_API_KEY
    console.log("[v0] YouTube API key status:", {
      exists: !!apiKey,
      length: apiKey?.length || 0,
      firstChars: apiKey?.substring(0, 10) || "none",
    })

    if (!apiKey) {
      console.error("[v0] YOUTUBE_API_KEY environment variable is not set!")
      throw new Error("YouTube API key is not configured")
    }

    if (!query) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
    }

    // Check cache first
    const cacheKey = getCacheKey.search(query)
    const cachedData = musicCache.get(cacheKey)

    if (cachedData) {
      console.log("[v0] Returning cached data for query:", query, "items:", cachedData.length)
      const response = NextResponse.json({
        songs: cachedData.slice(0, maxResults),
        videos: cachedData.slice(0, maxResults),
        source: "cache",
        query,
      })

      response.headers.set("Cache-Control", "public, s-maxage=1200, stale-while-revalidate=3600")
      response.headers.set("CDN-Cache-Control", "public, s-maxage=1200")
      response.headers.set("Vercel-CDN-Cache-Control", "public, s-maxage=1200")

      return response
    }

    console.log("[v0] Creating YouTube API instance...")
    const youtubeAPI = createYouTubeMusicAPI()
    console.log("[v0] YouTube API created successfully, calling search...")

    const results = await youtubeAPI.search(query, maxResults)
    console.log("[v0] YouTube API search completed:", {
      hasResults: !!results,
      hasVideos: !!results?.videos,
      videosLength: results?.videos?.length || 0,
      resultKeys: results ? Object.keys(results) : "no results",
      firstResult: results?.videos?.[0]
        ? {
            id: results.videos[0].id,
            title: results.videos[0].title,
            artist: results.videos[0].artist,
          }
        : "no first result",
    })

    if (results.videos && results.videos.length > 0) {
      console.log("[v0] Processing YouTube results, first item:", results.videos[0])
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
      musicCache.set(cacheKey, songs, 20 * 60 * 1000) // 20 minutes

      const response = NextResponse.json({
        songs: songs.slice(0, maxResults),
        videos: songs.slice(0, maxResults),
        source: "youtube_api",
        query,
      })

      response.headers.set("Cache-Control", "public, s-maxage=1200, stale-while-revalidate=3600")
      response.headers.set("CDN-Cache-Control", "public, s-maxage=1200")
      response.headers.set("Vercel-CDN-Cache-Control", "public, s-maxage=1200")

      return response
    }

    console.log("[v0] No YouTube results found, using fallback data for query:", query)
    console.log("[v0] YouTube API returned:", results)

    // Fallback to static data
    const queryLower = query.toLowerCase()
    const fallbackResults = fallbackSearchResults[queryLower] || fallbackSearchResults.default || []

    const response = NextResponse.json({
      songs: fallbackResults.slice(0, maxResults),
      videos: fallbackResults.slice(0, maxResults),
      source: "fallback",
      query,
    })

    response.headers.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=7200")
    response.headers.set("CDN-Cache-Control", "public, s-maxage=3600")
    response.headers.set("Vercel-CDN-Cache-Control", "public, s-maxage=3600")

    return response
  } catch (error) {
    console.error("[v0] Music search API error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      query: new URL(request.url).searchParams.get("q"),
      apiKeyExists: !!process.env.YOUTUBE_API_KEY,
    })

    const query = new URL(request.url).searchParams.get("q") || ""
    const maxResults = Number.parseInt(new URL(request.url).searchParams.get("maxResults") || "20")
    const queryLower = query.toLowerCase()
    const fallbackResults = fallbackSearchResults[queryLower] || fallbackSearchResults.default || []

    const response = NextResponse.json({
      songs: fallbackResults.slice(0, maxResults),
      videos: fallbackResults.slice(0, maxResults),
      source: "error_fallback",
      query,
      error: error.message,
    })

    response.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600")
    response.headers.set("CDN-Cache-Control", "public, s-maxage=300")
    response.headers.set("Vercel-CDN-Cache-Control", "public, s-maxage=300")

    return response
  }
}
