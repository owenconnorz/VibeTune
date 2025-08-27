import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get("videoId")
    const quality = searchParams.get("quality") || "medium"

    console.log("[v0] Stream API called for video:", videoId, "quality:", quality)

    if (!videoId) {
      return NextResponse.json({ error: "videoId parameter is required" }, { status: 400 })
    }

    const response = {
      videoId,
      title: "Sample Song",
      duration: "3:30",
      thumbnail: "/placeholder.svg?height=300&width=300",
      author: "Sample Artist",
      viewCount: "1000000",
      streams: {
        audio: {
          url: "https://example.com/sample-audio.mp3",
          mimeType: "audio/mp3",
          bitrate: quality === "high" ? 256000 : 128000,
          quality: quality,
        },
        video: null,
        merged: false,
      },
      source: "offline_music",
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("[v0] Stream API error:", error)
    return NextResponse.json(
      {
        error: error.message,
        videoId: new URL(request.url).searchParams.get("videoId"),
        source: "offline_music",
      },
      { status: 500 },
    )
  }
}
