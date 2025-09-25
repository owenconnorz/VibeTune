import { type NextRequest, NextResponse } from "next/server"
import { youtubeMusicScraper } from "@/lib/youtube-music-scraper"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    console.log("[v0] YouTube Music API: Trending request, limit:", limit)

    const result = await youtubeMusicScraper.getTrending(limit)

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error("[v0] YouTube Music API trending error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      tracks: [],
      totalCount: 0,
      hasNextPage: false,
    })
  }
}
