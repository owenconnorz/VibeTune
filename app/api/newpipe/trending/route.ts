import { type NextRequest, NextResponse } from "next/server"
import { createNewPipeExtractor } from "@/lib/newpipe-extractor"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] NewPipe API: Trending request received")

    const { searchParams } = new URL(request.url)
    const maxResults = Number.parseInt(searchParams.get("maxResults") || "25")

    const extractor = createNewPipeExtractor()
    const songs = await extractor.getTrending(maxResults)

    console.log("[v0] NewPipe API: Returning", songs.length, "trending songs")

    return NextResponse.json({
      source: "NewPipe Extractor",
      songs,
      count: songs.length,
    })
  } catch (error) {
    console.error("[v0] NewPipe API: Trending failed:", error)

    return NextResponse.json({
      source: "NewPipe Extractor",
      songs: [],
      count: 0,
      error: error.message || "Failed to fetch trending music",
    })
  }
}
