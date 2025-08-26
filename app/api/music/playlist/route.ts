import { type NextRequest, NextResponse } from "next/server"
import { createYouTubeMusicAPI } from "@/lib/youtube-music-api"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const playlistId = searchParams.get("playlistId")
    const maxResults = Number.parseInt(searchParams.get("maxResults") || "50")

    if (!playlistId) {
      return NextResponse.json({ error: "Playlist ID is required" }, { status: 400 })
    }

    const youtubeAPI = createYouTubeMusicAPI()
    const result = await youtubeAPI.getPlaylist(playlistId, { maxResults })

    return NextResponse.json({ videos: result.songs })
  } catch (error) {
    console.error("Playlist API error:", error)
    return NextResponse.json({ error: "Failed to fetch playlist videos" }, { status: 500 })
  }
}
