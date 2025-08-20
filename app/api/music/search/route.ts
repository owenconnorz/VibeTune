import { type NextRequest, NextResponse } from "next/server"
import { createYouTubeAPI } from "@/lib/youtube-api"
import { fallbackSearchResults } from "@/lib/fallback-data"
import { musicCache, getCacheKey } from "@/lib/music-cache"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const maxResults = Number.parseInt(searchParams.get("maxResults") || "20")

    if (!query) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
    }

    const cacheKey = getCacheKey.search(query)
    const cachedData = musicCache.get(cacheKey)

    if (cachedData) {
      return NextResponse.json({
        videos: cachedData.slice(0, maxResults),
        source: "cache",
        query,
      })
    }

    const youtube = createYouTubeAPI()
    const results = await youtube.searchMusic(query, maxResults)

    if (results.videos && results.videos.length > 0) {
      musicCache.set(cacheKey, results.videos, 20 * 60 * 1000)
      return NextResponse.json({ ...results, source: "youtube", query })
    }

    const queryLower = query.toLowerCase()
    const fallbackResults = fallbackSearchResults[queryLower] || fallbackSearchResults.default || []

    return NextResponse.json({
      videos: fallbackResults.slice(0, maxResults),
      source: "fallback",
      query,
    })
  } catch (error) {
    console.error("Search API error:", error)

    const query = new URL(request.url).searchParams.get("q") || ""
    const maxResults = Number.parseInt(new URL(request.url).searchParams.get("maxResults") || "20")
    const queryLower = query.toLowerCase()
    const fallbackResults = fallbackSearchResults[queryLower] || fallbackSearchResults.default || []

    return NextResponse.json({
      videos: fallbackResults.slice(0, maxResults),
      source: "error_fallback",
      query,
    })
  }
}
