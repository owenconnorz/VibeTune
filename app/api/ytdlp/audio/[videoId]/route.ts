import { type NextRequest, NextResponse } from "next/server"
import { createYtDlpExtractor } from "@/lib/ytdlp-extractor"

export async function GET(request: NextRequest, { params }: { params: { videoId: string } }) {
  try {
    const { videoId } = params
    console.log("[v0] YtDlp API: Audio URL request for:", videoId)

    if (!videoId) {
      return NextResponse.json({
        error: "Video ID required",
        audioUrl: null,
      })
    }

    const extractor = createYtDlpExtractor()
    const audioUrl = await extractor.getAudioUrl(videoId)

    if (audioUrl) {
      console.log("[v0] YtDlp API: Successfully got audio URL for:", videoId)
      return NextResponse.json({
        videoId,
        audioUrl,
        success: true,
      })
    } else {
      console.log("[v0] YtDlp API: No audio URL found for:", videoId)
      return NextResponse.json({
        videoId,
        audioUrl: null,
        success: false,
        error: "No audio URL found",
      })
    }
  } catch (error) {
    console.error("[v0] YtDlp API: Audio URL failed:", error)

    return NextResponse.json({
      videoId: params.videoId,
      audioUrl: null,
      success: false,
      error: error.message || "Failed to get audio URL",
    })
  }
}
