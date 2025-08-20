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
      console.log("[v0] Returning cached search results for:", query)
      return NextResponse.json({
        videos: cachedData.slice(0, maxResults),
        source: "cache",
        query,
      })
    }

    const youtube = createYouTubeAPI()

    console.log("[v0] Using Innertube API to search for:", query)
    const results = await youtube.searchMusic(query, maxResults)
    console.log("[v0] Innertube API returned:", results.videos?.length || 0, "results for:", query)

    if (results.videos && results.videos.length > 0) {
      musicCache.set(cacheKey, results.videos, 20 * 60 * 1000) // 20 minutes for real data
      return NextResponse.json({ ...results, source: "innertube", query })
    } else {
      // If no results from Innertube, use fallback
      console.log("[v0] No results from Innertube, using fallback search data for query:", query)
      const queryLower = query.toLowerCase()
      let fallbackResults =
        fallbackSearchResults[queryLower] || fallbackSearchResults.default || fallbackSearchResults.pop || []

      // If no specific match, try partial matching
      if (fallbackResults.length === 0) {
        const partialMatch = Object.keys(fallbackSearchResults).find(
          (key) => key.includes(queryLower) || queryLower.includes(key),
        )
        if (partialMatch) {
          fallbackResults = fallbackSearchResults[partialMatch]
        }
      }

      if (fallbackResults.length > 0) {
        musicCache.set(cacheKey, fallbackResults, 10 * 60 * 1000) // 10 minutes for fallback
      }

      console.log("[v0] Returning fallback results:", fallbackResults.length, "items for query:", query)
      return NextResponse.json({
        videos: fallbackResults.slice(0, maxResults),
        source: "fallback",
        query,
      })
    }
  } catch (error) {
    console.error("[v0] Search API error:", error)
    console.log("[v0] Innertube API error, falling back to mock data")

    const query = new URL(request.url).searchParams.get("q") || ""
    const maxResults = Number.parseInt(new URL(request.url).searchParams.get("maxResults") || "20")
    const queryLower = query.toLowerCase()

    let results = fallbackSearchResults[queryLower] || fallbackSearchResults.default || []

    if (results.length === 0) {
      const partialMatch = Object.keys(fallbackSearchResults).find(
        (key) => key.includes(queryLower) || queryLower.includes(key),
      )
      if (partialMatch) {
        results = fallbackSearchResults[partialMatch]
      }
    }

    const cacheKey = getCacheKey.search(query)
    if (results.length > 0) {
      musicCache.set(cacheKey, results, 5 * 60 * 1000) // 5 minutes for error fallback
    }

    return NextResponse.json({
      videos: results.slice(0, maxResults),
      source: "fallback_error",
      query,
    })
  }
}
