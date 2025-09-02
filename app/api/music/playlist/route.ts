import { type NextRequest, NextResponse } from "next/server"
import { createPipedAPI } from "@/lib/piped-api"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const playlistId = searchParams.get("playlistId")
    const maxResults = Number.parseInt(searchParams.get("maxResults") || "50")

    if (!playlistId) {
      return NextResponse.json({ error: "Playlist ID is required" }, { status: 400 })
    }

    const pipedAPI = createPipedAPI()
    const results = await pipedAPI.getPlaylist(playlistId, maxResults)

    const videos = results.videos.map((video) => ({
      id: video.id,
      title: video.title,
      artist: video.artist,
      thumbnail: video.thumbnail,
      duration: video.duration,
      channelTitle: video.artist,
      publishedAt: video.publishedAt || new Date().toISOString(),
      viewCount: video.views || "1000000",
      url: video.url,
      audioUrl: video.audioUrl,
      source: "piped",
    }))

    return NextResponse.json({ videos })
  } catch (error) {
    console.error("Playlist API error:", error)
    return NextResponse.json({ error: "Failed to fetch playlist videos" }, { status: 500 })
  }
}
