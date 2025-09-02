import { type NextRequest, NextResponse } from "next/server"
import { createYouTubePipedHybrid } from "@/lib/youtube-piped-hybrid"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Hybrid API: Trending request received")

    const { searchParams } = new URL(request.url)
    const maxResults = Number.parseInt(searchParams.get("maxResults") || "25")

    const hybrid = createYouTubePipedHybrid()
    const songs = await hybrid.getTrending(maxResults)

    console.log("[v0] Hybrid API: Returning", songs.length, "trending songs")

    return NextResponse.json({
      source: "YouTube-Piped Hybrid",
      songs,
      count: songs.length,
    })
  } catch (error) {
    console.error("[v0] Hybrid API: Trending failed:", error)

    return NextResponse.json({
      source: "YouTube-Piped Hybrid",
      songs: [],
      count: 0,
      error: error.message || "Failed to fetch trending music",
    })
  }
}
