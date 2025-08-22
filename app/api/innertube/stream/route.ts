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
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept: "application/json",
          "Accept-Language": "en-US,en;q=0.9",
          Origin: "https://www.youtube.com",
          Referer: "https://www.youtube.com/",
        },
        body: JSON.stringify({
          context: {
            client: {
              clientName: "WEB",
              clientVersion: "2.20240304.00.00",
              hl: "en",
              gl: "US",
            },
          },
          videoId: videoId,
        }),
      },
    )

    if (!response.ok) {
      console.error("[v0] Innertube API response error:", response.status, response.statusText)
      const errorText = await response.text()
      console.error("[v0] Error details:", errorText)
      throw new Error(`Innertube API error: ${response.status}`)
    }

    const data = await response.json()

    console.log("[v0] Innertube API response received")
    console.log("[v0] Video details:", data.videoDetails?.title, "Duration:", data.videoDetails?.lengthSeconds)
    console.log("[v0] Streaming data available:", !!data.streamingData)
    console.log("[v0] Streaming data structure:", JSON.stringify(data.streamingData, null, 2))

    const adaptiveFormats = data.streamingData?.adaptiveFormats || []
    const regularFormats = data.streamingData?.formats || []
    const allFormats = [...adaptiveFormats, ...regularFormats]

    console.log("[v0] Adaptive formats count:", adaptiveFormats.length)
    console.log("[v0] Regular formats count:", regularFormats.length)
    console.log("[v0] Total formats count:", allFormats.length)

    allFormats.forEach((format: any, index: number) => {
      console.log(`[v0] Format ${index}:`, {
        mimeType: format.mimeType,
        hasUrl: !!format.url,
        bitrate: format.averageBitrate || format.bitrate,
        quality: format.quality,
        audioChannels: format.audioChannels,
        audioSampleRate: format.audioSampleRate,
      })
    })

    const audioFormats = allFormats
      .filter((format: any) => {
        const hasAudio = format.mimeType?.includes("audio") || format.audioChannels > 0
        const hasUrl = format.url || format.signatureCipher || format.cipher
        console.log("[v0] Format check:", {
          mimeType: format.mimeType,
          hasAudio,
          hasUrl,
          audioChannels: format.audioChannels,
        })
        return hasAudio && hasUrl
      })
      .sort((a: any, b: any) => {
        const aBitrate = Number.parseInt(a.averageBitrate || a.bitrate || "0")
        const bBitrate = Number.parseInt(b.averageBitrate || b.bitrate || "0")
        return bBitrate - aBitrate
      })

    console.log("[v0] Filtered audio formats count:", audioFormats.length)

    if (audioFormats.length === 0) {
      console.error("[v0] No audio formats found. All formats:")
      allFormats.forEach((format: any, index: number) => {
        console.error(`[v0] Format ${index}:`, {
          mimeType: format.mimeType,
          hasUrl: !!(format.url || format.signatureCipher || format.cipher),
          audioChannels: format.audioChannels,
        })
      })
      throw new Error("No audio formats available")
    }

    const preferredFormat = audioFormats[0]

    let streamUrl = preferredFormat.url
    if (!streamUrl && (preferredFormat.signatureCipher || preferredFormat.cipher)) {
      console.log("[v0] Format requires signature decoding - using fallback")
      const directUrlFormat = audioFormats.find((f: any) => f.url)
      if (directUrlFormat) {
        streamUrl = directUrlFormat.url
      } else {
        throw new Error("No direct stream URL available")
      }
    }

    if (!streamUrl) {
      throw new Error("No stream URL found")
    }

    console.log(
      "[v0] Selected audio format:",
      preferredFormat.mimeType,
      "bitrate:",
      preferredFormat.averageBitrate || preferredFormat.bitrate,
    )
    console.log("[v0] Stream URL available:", !!streamUrl)

    return NextResponse.json({
      streamUrl: streamUrl,
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
