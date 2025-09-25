import { type NextRequest, NextResponse } from "next/server"
import { createNewPipeExtractor } from "@/lib/newpipe-extractor"

export async function GET(request: NextRequest, { params }: { params: { videoId: string } }) {
  try {
    console.log("[v0] NewPipe API: Audio URL request for:", params.videoId)

    const extractor = createNewPipeExtractor()
    const audioUrl = await extractor.getAudioUrl(params.videoId)

    if (!audioUrl) {
      return NextResponse.json({
        source: "NewPipe Extractor",
        audioUrl: null,
        error: "No audio URL found",
      })
    }

    console.log("[v0] NewPipe API: Returning audio URL for:", params.videoId)

    return NextResponse.json({
      source: "NewPipe Extractor",
      audioUrl,
      videoId: params.videoId,
    })
  } catch (error) {
    console.error("[v0] NewPipe API: Audio URL failed for:", params.videoId, error)

    return NextResponse.json({
      source: "NewPipe Extractor",
      audioUrl: null,
      error: error.message || "Failed to get audio URL",
    })
  }
}
