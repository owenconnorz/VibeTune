import { type NextRequest, NextResponse } from "next/server"
import { createYouTubeMusicAPI } from "@/lib/youtube-music-api"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get("videoId")
    const quality = searchParams.get("quality") || "medium"
    const format = searchParams.get("format") || "audio"

    console.log("[v0] Stream API called for video:", videoId, "quality:", quality, "format:", format)

    if (!videoId) {
      return NextResponse.json({ error: "videoId parameter is required" }, { status: 400 })
    }

    const apiKey = process.env.YOUTUBE_API_KEY
    if (!apiKey) {
      throw new Error("YouTube API key not configured")
    }

    const youtubeAPI = createYouTubeMusicAPI()
    const streamData = await youtubeAPI.getStreamUrl(videoId)

    if (!streamData.url) {
      throw new Error("No stream URL available")
    }

    const response = {
      videoId,
      title: streamData.title,
      duration: streamData.duration,
      thumbnail: streamData.thumbnail,
      author: streamData.author,
      viewCount: streamData.viewCount,
      streams: {
        audio: {
          url: streamData.url,
          mimeType: "audio/mp4",
          bitrate: quality === "high" ? 256000 : 128000,
          quality: quality,
        },
        video: null,
        merged: false,
      },
      source: "youtube_simple",
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("[v0] Stream API error:", error)
    return NextResponse.json(
      {
        error: error.message,
        videoId: new URL(request.url).searchParams.get("videoId"),
        source: "youtube_simple",
      },
      { status: 500 },
    )
  }
}
