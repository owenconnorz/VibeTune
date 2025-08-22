import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { videoId } = await request.json()

    if (!videoId) {
      return NextResponse.json({ error: "Video ID is required" }, { status: 400 })
    }

    console.log("[v0] Innertube stream request for videoId:", videoId)

    const response = await fetch(
      "https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        body: JSON.stringify({
          context: {
            client: {
              clientName: "ANDROID",
              clientVersion: "19.09.37",
              androidSdkVersion: 30,
              hl: "en",
              gl: "US",
            },
          },
          videoId: videoId,
          params: "CgIQBg%3D%3D", // Audio-only parameter
        }),
      },
    )

    if (!response.ok) {
      console.error("[v0] Innertube API response error:", response.status, response.statusText)
      throw new Error(`Innertube API error: ${response.status}`)
    }

    const data = await response.json()

    console.log("[v0] Innertube API response received")
    console.log("[v0] Video details:", data.videoDetails?.title, "Duration:", data.videoDetails?.lengthSeconds)
    console.log("[v0] Streaming data available:", !!data.streamingData)
    console.log("[v0] Adaptive formats count:", data.streamingData?.adaptiveFormats?.length || 0)

    const formats = data.streamingData?.adaptiveFormats || []

    console.log("[v0] All available formats:")
    formats.forEach((format: any, index: number) => {
      console.log(`[v0] Format ${index}:`, {
        mimeType: format.mimeType,
        hasUrl: !!format.url,
        bitrate: format.averageBitrate || format.bitrate,
        quality: format.quality,
        audioChannels: format.audioChannels,
        audioSampleRate: format.audioSampleRate,
      })
    })

    // Filter for audio-only formats and sort by quality
    const audioFormats = formats
      .filter((format: any) => format.mimeType?.includes("audio") && format.url && !format.mimeType?.includes("video"))
      .sort((a: any, b: any) => {
        // Prioritize higher bitrate audio
        const aBitrate = Number.parseInt(a.averageBitrate || a.bitrate || "0")
        const bBitrate = Number.parseInt(b.averageBitrate || b.bitrate || "0")
        return bBitrate - aBitrate
      })

    console.log("[v0] Filtered audio formats count:", audioFormats.length)
    audioFormats.forEach((format: any, index: number) => {
      console.log(`[v0] Audio format ${index}:`, {
        mimeType: format.mimeType,
        bitrate: format.averageBitrate || format.bitrate,
        sampleRate: format.audioSampleRate,
        channels: format.audioChannels,
      })
    })

    const preferredFormat =
      audioFormats.find((format: any) => format.mimeType?.includes("mp4a") || format.mimeType?.includes("opus")) ||
      audioFormats[0]

    if (!preferredFormat?.url) {
      console.error("[v0] No audio stream found. Available formats:", formats.length)
      console.error("[v0] Streaming data structure:", JSON.stringify(data.streamingData, null, 2))
      throw new Error("No audio stream found")
    }

    console.log(
      "[v0] Selected audio format:",
      preferredFormat.mimeType,
      "bitrate:",
      preferredFormat.averageBitrate || preferredFormat.bitrate,
    )

    console.log("[v0] Stream URL length:", preferredFormat.url.length)
    console.log("[v0] Stream URL starts with:", preferredFormat.url.substring(0, 50))

    return NextResponse.json({
      streamUrl: preferredFormat.url,
      duration: data.videoDetails?.lengthSeconds,
      audioQuality: {
        mimeType: preferredFormat.mimeType,
        bitrate: preferredFormat.averageBitrate || preferredFormat.bitrate,
        sampleRate: preferredFormat.audioSampleRate,
        channels: preferredFormat.audioChannels,
      },
    })
  } catch (error) {
    console.error("[v0] Innertube stream API error:", error)
    return NextResponse.json({ error: "Failed to get stream URL" }, { status: 500 })
  }
}
