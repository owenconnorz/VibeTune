import { type NextRequest, NextResponse } from "next/server"
import { createYouTubeAPI } from "@/lib/youtube-api"
import { fallbackSearchResults } from "@/lib/fallback-data"
import { musicCache, getCacheKey } from "@/lib/music-cache"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const maxResults = Number.parseInt(searchParams.get("maxResults") || "20")

    console.log("[v0] Search API called with query:", query)
    console.log("[v0] YouTube API Key available:", !!process.env.YOUTUBE_API_KEY)
    console.log("[v0] Environment:", process.env.NODE_ENV)

    if (!query) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
    }

    const cacheKey = getCacheKey.search(query)
    const cachedData = musicCache.get(cacheKey)

    if (cachedData) {
      console.log("[v0] Returning cached data for:", query)
      return NextResponse.json({
        videos: cachedData.slice(0, maxResults),
        source: "cache",
        query,
      })
    }

    console.log("[v0] Creating YouTube API instance...")
    const youtube = createYouTubeAPI()

    console.log("[v0] Calling YouTube API searchMusic...")
    const results = await youtube.searchMusic(query, maxResults)

    console.log("[v0] YouTube API results:", {
      hasVideos: !!results.videos,
      videoCount: results.videos?.length || 0,
      firstVideoTitle: results.videos?.[0]?.title || "none",
    })

    if (results.videos && results.videos.length > 0) {
      musicCache.set(cacheKey, results.videos, 20 * 60 * 1000)
      console.log("[v0] Returning YouTube results for:", query)
      return NextResponse.json({ ...results, source: "youtube", query })
    }

    console.log("[v0] No YouTube results, using fallback data for:", query)
    const queryLower = query.toLowerCase()
    const fallbackResults = fallbackSearchResults[queryLower] || fallbackSearchResults.default || []

    return NextResponse.json({
      videos: fallbackResults.slice(0, maxResults),
      source: "fallback",
      query,
    })
  } catch (error) {
    console.error("[v0] Search API error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })

    const query = new URL(request.url).searchParams.get("q") || ""
    const maxResults = Number.parseInt(new URL(request.url).searchParams.get("maxResults") || "20")
    const queryLower = query.toLowerCase()
    const fallbackResults = fallbackSearchResults[queryLower] || fallbackSearchResults.default || []

    console.log("[v0] Returning error fallback data for:", query)
    return NextResponse.json({
      videos: fallbackResults.slice(0, maxResults),
      source: "error_fallback",
      query,
      error: error.message,
    })
  }
}
