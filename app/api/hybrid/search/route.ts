import { type NextRequest, NextResponse } from "next/server"
import { createYouTubePipedHybrid } from "@/lib/youtube-piped-hybrid"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Hybrid API: Search request received")

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const maxResults = Number.parseInt(searchParams.get("maxResults") || "15")

    if (!query) {
      return NextResponse.json({
        source: "YouTube-Piped Hybrid",
        songs: [],
        count: 0,
        error: "Query parameter required",
      })
    }

    const hybrid = createYouTubePipedHybrid()
    const songs = await hybrid.search(query, maxResults)

    console.log("[v0] Hybrid API: Returning", songs.length, "search results")

    return NextResponse.json({
      source: "YouTube-Piped Hybrid",
      songs,
      count: songs.length,
    })
  } catch (error) {
    console.error("[v0] Hybrid API: Search failed:", error)

    return NextResponse.json({
      source: "YouTube-Piped Hybrid",
      songs: [],
      count: 0,
      error: error.message || "Search failed",
    })
  }
}
