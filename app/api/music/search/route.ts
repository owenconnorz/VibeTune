import { type NextRequest, NextResponse } from "next/server"
import { createYouTubeAPI } from "@/lib/youtube-api"
import { fallbackSearchResults } from "@/lib/fallback-data"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const maxResults = Number.parseInt(searchParams.get("maxResults") || "20")

    if (!query) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
    }

    const apiKey = process.env.YOUTUBE_API_KEY

    if (!apiKey) {
      console.log("[v0] YouTube API key not configured, using fallback search data for query:", query)
      const queryLower = query.toLowerCase()
      let results =
        fallbackSearchResults[queryLower] || fallbackSearchResults.default || fallbackSearchResults.pop || []

      // If no specific match, try partial matching
      if (results.length === 0) {
        const partialMatch = Object.keys(fallbackSearchResults).find(
          (key) => key.includes(queryLower) || queryLower.includes(key),
        )
        if (partialMatch) {
          results = fallbackSearchResults[partialMatch]
        }
      }

      console.log("[v0] Returning fallback results:", results.length, "items for query:", query)
      return NextResponse.json({
        videos: results.slice(0, maxResults),
        source: "fallback",
        query,
      })
    }

    const youtube = createYouTubeAPI(apiKey)

    console.log("[v0] Using YouTube API to search for:", query)
    const results = await youtube.searchMusic(query, maxResults)
    console.log("[v0] YouTube API returned:", results.videos?.length || 0, "results for:", query)

    return NextResponse.json({ ...results, source: "youtube", query })
  } catch (error) {
    console.error("[v0] Search API error:", error)

    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes("quota")) {
      console.log("[v0] Search API quota exceeded, using fallback data")
    } else {
      console.log("[v0] Search API error, falling back to mock data")
    }

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

    return NextResponse.json({
      videos: results.slice(0, maxResults),
      source: "fallback_error",
      query,
    })
  }
}
