import { type NextRequest, NextResponse } from "next/server"
import { youtubeMusicScraper } from "@/lib/youtube-music-scraper"

export async function GET(request: NextRequest, { params }: { params: { videoId: string } }) {
  try {
    const videoId = params.videoId

    console.log("[v0] YouTube Music API: Audio URL request for:", videoId)

    const audioUrl = await youtubeMusicScraper.getAudioUrl(videoId)

    return NextResponse.json({
      success: true,
      audioUrl,
      videoId,
    })
  } catch (error) {
    console.error("[v0] YouTube Music API audio error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      audioUrl: null,
    })
  }
}
