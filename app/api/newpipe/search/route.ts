import { type NextRequest, NextResponse } from "next/server"
import { createNewPipeExtractor } from "@/lib/newpipe-extractor"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] NewPipe API: Search request received")

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const maxResults = Number.parseInt(searchParams.get("maxResults") || "15")

    if (!query) {
      return NextResponse.json({
        source: "NewPipe Extractor",
        songs: [],
        count: 0,
        error: "Query parameter required",
      })
    }

    const extractor = createNewPipeExtractor()
    const songs = await extractor.search(query, maxResults)

    console.log("[v0] NewPipe API: Returning", songs.length, "search results")

    return NextResponse.json({
      source: "NewPipe Extractor",
      songs,
      count: songs.length,
    })
  } catch (error) {
    console.error("[v0] NewPipe API: Search failed:", error)

    return NextResponse.json({
      source: "NewPipe Extractor",
      songs: [],
      count: 0,
      error: error.message || "Search failed",
    })
  }
}
