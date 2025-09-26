import { type NextRequest, NextResponse } from "next/server"
import { YouTubeMusicInnerTube } from "@/lib/youtube-music-innertube"

export async function GET(request: NextRequest, { params }: { params: { videoId: string } }) {
  try {
    const { videoId } = params

    if (!videoId) {
      return NextResponse.json({ error: "Video ID is required" }, { status: 400 })
    }

    console.log("[v0] InnerTube API: Getting audio stream for:", videoId)

    const videoInfo = await YouTubeMusicInnerTube.getVideoInfo(videoId)

    if (!videoInfo) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    // Extract the best audio stream URL
    const audioUrl = extractBestAudioStream(videoInfo)

    if (!audioUrl) {
      return NextResponse.json({ error: "No audio stream found" }, { status: 404 })
    }

    return NextResponse.json({
      audioUrl,
      title: videoInfo.title,
      duration: videoInfo.duration,
    })
  } catch (error) {
    console.error("[v0] InnerTube audio stream error:", error)
    return NextResponse.json({ error: "Failed to get audio stream" }, { status: 500 })
  }
}

function extractBestAudioStream(videoInfo: any): string | null {
  try {
    // Look for adaptive formats (audio-only streams)
    const adaptiveFormats = videoInfo.streamingData?.adaptiveFormats || []

    // Filter for audio-only streams
    const audioStreams = adaptiveFormats.filter((format: any) => format.mimeType?.includes("audio") && format.url)

    if (audioStreams.length === 0) {
      // Fallback to regular formats
      const formats = videoInfo.streamingData?.formats || []
      const audioFormat = formats.find((format: any) => format.url)
      return audioFormat?.url || null
    }

    // Prefer higher quality audio streams
    const sortedStreams = audioStreams.sort((a: any, b: any) => {
      const aBitrate = Number.parseInt(a.averageBitrate || a.bitrate || "0")
      const bBitrate = Number.parseInt(b.averageBitrate || b.bitrate || "0")
      return bBitrate - aBitrate
    })

    return sortedStreams[0]?.url || null
  } catch (error) {
    console.error("[v0] Error extracting audio stream:", error)
    return null
  }
}
