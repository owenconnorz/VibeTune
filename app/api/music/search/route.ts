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
      console.log("[v0] YouTube API key not configured, using fallback search data")
      const results = fallbackSearchResults[query.toLowerCase()] || fallbackSearchResults.default
      return NextResponse.json({ videos: results.slice(0, maxResults) })
    }

    const youtube = createYouTubeAPI(apiKey)
    const results = await youtube.searchMusic(query, maxResults)

    return NextResponse.json(results)
  } catch (error) {
    console.error("Search API error:", error)
    console.log("[v0] Search API error, falling back to mock data")
    const maxResults = 20 // Declare maxResults variable here
    const results = fallbackSearchResults.default
    return NextResponse.json({ videos: results.slice(0, maxResults) })
  }
}
