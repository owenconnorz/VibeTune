import { type NextRequest, NextResponse } from "next/server"
import { createMusicAPI } from "@/lib/youtube-data-api"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const playlistId = searchParams.get("playlistId")
    const maxResults = Number.parseInt(searchParams.get("maxResults") || "50")

    if (!playlistId) {
      return NextResponse.json({ error: "Playlist ID is required" }, { status: 400 })
    }

    const musicAPI = createMusicAPI()
    const results = await musicAPI.getTrending(maxResults)

    const videos = results.tracks.map((track) => ({
      id: track.id,
      title: track.title,
      artist: track.artist,
      thumbnail: track.thumbnail,
      duration: track.duration,
      channelTitle: track.artist, // Keep for backward compatibility
      publishedAt: new Date().toISOString(),
      viewCount: "1000000",
      url: track.url,
      source: track.source,
    }))

    return NextResponse.json({ videos })
  } catch (error) {
    console.error("Playlist API error:", error)
    return NextResponse.json({ error: "Failed to fetch playlist videos" }, { status: 500 })
  }
}
