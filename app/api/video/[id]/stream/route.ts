import { type NextRequest, NextResponse } from "next/server"
import { getAudioStream } from "@/lib/innertube"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const videoId = params.id

    if (!videoId) {
      return NextResponse.json({ error: "Video ID is required" }, { status: 400 })
    }

    console.log("[v0] Fetching audio stream for video:", videoId)

    // Get audio stream URL from InnerTube
    const audioUrl = await getAudioStream(videoId)

    if (!audioUrl) {
      return NextResponse.json({ error: "Audio stream not found" }, { status: 404 })
    }

    return NextResponse.json({ audioUrl })
  } catch (error) {
    console.error("[v0] Error fetching audio stream:", error)
    return NextResponse.json({ error: "Failed to fetch audio stream" }, { status: 500 })
  }
}
