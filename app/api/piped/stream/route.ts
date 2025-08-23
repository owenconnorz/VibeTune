import { type NextRequest, NextResponse } from "next/server"
import { createPipedAPI } from "@/lib/piped-api"

export async function POST(request: NextRequest) {
  try {
    const { videoId } = await request.json()

    if (!videoId) {
      return NextResponse.json({ error: "Video ID is required" }, { status: 400 })
    }

    console.log("[v0] Piped stream request for videoId:", videoId)

    const piped = createPipedAPI()
    const streamData = await piped.getStreams(videoId)

    console.log("[v0] Piped API response received")
    console.log("[v0] Video details:", streamData.title, "Duration:", streamData.duration)
    console.log("[v0] Audio streams available:", streamData.audioStreams?.length || 0)

    if (!streamData.audioStreams || streamData.audioStreams.length === 0) {
      console.error("[v0] No audio streams found for videoId:", videoId)
      throw new Error("No audio streams available")
    }

    const sortedAudioStreams = streamData.audioStreams
      .filter((stream: any) => stream.url && stream.mimeType)
      .sort((a: any, b: any) => {
        const aBitrate = Number.parseInt(a.bitrate || "0")
        const bBitrate = Number.parseInt(b.bitrate || "0")
        return bBitrate - aBitrate
      })

    console.log("[v0] Sorted audio streams count:", sortedAudioStreams.length)

    if (sortedAudioStreams.length === 0) {
      throw new Error("No valid audio streams found")
    }

    const bestAudioStream = sortedAudioStreams[0]

    console.log("[v0] Selected audio stream:", {
      mimeType: bestAudioStream.mimeType,
      bitrate: bestAudioStream.bitrate,
      quality: bestAudioStream.quality,
    })

    return NextResponse.json({
      streamUrl: bestAudioStream.url,
      duration: streamData.duration,
      audioQuality: {
        mimeType: bestAudioStream.mimeType,
        bitrate: bestAudioStream.bitrate,
        quality: bestAudioStream.quality,
        codec: bestAudioStream.codec,
      },
      title: streamData.title,
      thumbnail: streamData.thumbnailUrl,
    })
  } catch (error) {
    console.error("[v0] Piped stream API error:", error)
    return NextResponse.json(
      {
        error: "Failed to get stream URL",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
