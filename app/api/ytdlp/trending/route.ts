import { type NextRequest, NextResponse } from "next/server"
import { createYtDlpExtractor } from "@/lib/ytdlp-extractor"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] YtDlp API: Trending request received")

    const { searchParams } = new URL(request.url)
    const maxResults = Number.parseInt(searchParams.get("maxResults") || "25")

    const extractor = createYtDlpExtractor()
    const songs = await extractor.getTrending(maxResults)

    console.log("[v0] YtDlp API: Returning", songs.length, "trending songs")

    return NextResponse.json({
      source: "YtDlp Extractor",
      songs,
      count: songs.length,
    })
  } catch (error) {
    console.error("[v0] YtDlp API: Trending failed:", error)

    return NextResponse.json({
      source: "YtDlp Extractor",
      songs: [],
      count: 0,
      error: error.message || "Failed to fetch trending music",
    })
  }
}
