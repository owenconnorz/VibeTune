import { type NextRequest, NextResponse } from "next/server"
import { createInnertubeAPI } from "@/lib/innertube-api"
import { fallbackSearchResults } from "@/lib/fallback-data"
import { musicCache, getCacheKey } from "@/lib/music-cache"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const maxResults = Number.parseInt(searchParams.get("maxResults") || "20")

    console.log("[v0] Search API called with query:", query)
    console.log("[v0] Using Innertube API")

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

    console.log("[v0] Creating Innertube API instance...")
    const innertube = createInnertubeAPI()

    console.log("[v0] Calling Innertube API searchMusic...")
    const results = await innertube.searchMusic(query, maxResults)

    console.log("[v0] Innertube API results:", {
      hasVideos: !!results.videos,
      videoCount: results.videos?.length || 0,
      firstVideoTitle: results.videos?.[0]?.title || "none",
    })

    if (results.videos && results.videos.length > 0) {
      musicCache.set(cacheKey, results.videos, 20 * 60 * 1000)
      console.log("[v0] Returning Innertube results for:", query)
      return NextResponse.json({ ...results, source: "innertube", query })
    }

    console.log("[v0] No Innertube results, using fallback data for:", query)
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
