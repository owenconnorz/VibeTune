import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { videoId } = await request.json()

    if (!videoId) {
      return NextResponse.json({ error: "Video ID is required" }, { status: 400 })
    }

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
              clientName: "WEB",
              clientVersion: "2.20231201.01.00",
              hl: "en",
              gl: "US",
            },
          },
          videoId: videoId,
        }),
      },
    )

    if (!response.ok) {
      throw new Error(`Innertube API error: ${response.status}`)
    }

    const data = await response.json()

    // Extract audio stream URL
    const formats = data.streamingData?.adaptiveFormats || []
    const audioFormat = formats.find((format: any) => format.mimeType?.includes("audio") && format.url)

    if (!audioFormat?.url) {
      throw new Error("No audio stream found")
    }

    return NextResponse.json({
      streamUrl: audioFormat.url,
      duration: data.videoDetails?.lengthSeconds,
    })
  } catch (error) {
    console.error("[v0] Innertube stream API error:", error)
    return NextResponse.json({ error: "Failed to get stream URL" }, { status: 500 })
  }
}
