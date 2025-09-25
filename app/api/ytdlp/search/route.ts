import { type NextRequest, NextResponse } from "next/server"
import { createYtDlpExtractor } from "@/lib/ytdlp-extractor"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] YtDlp API: Search request received")

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const maxResults = Number.parseInt(searchParams.get("maxResults") || "15")

    if (!query) {
      return NextResponse.json({
        source: "YtDlp Extractor",
        songs: [],
        count: 0,
        error: "Query parameter required",
      })
    }

    const extractor = createYtDlpExtractor()
    const songs = await extractor.search(query, maxResults)

    console.log("[v0] YtDlp API: Returning", songs.length, "search results")

    return NextResponse.json({
      source: "YtDlp Extractor",
      songs,
      count: songs.length,
    })
  } catch (error) {
    console.error("[v0] YtDlp API: Search failed:", error)

    return NextResponse.json({
      source: "YtDlp Extractor",
      songs: [],
      count: 0,
      error: error.message || "Search failed",
    })
  }
}
