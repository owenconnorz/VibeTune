import { type NextRequest, NextResponse } from "next/server"
import { ytDlpExtractor } from "@/lib/ytdlp-extractor"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const playlistId = searchParams.get("playlistId")
    const maxResults = Number.parseInt(searchParams.get("maxResults") || "50")

    if (!playlistId) {
      return NextResponse.json({ error: "Playlist ID is required" }, { status: 400 })
    }

    const results = await ytDlpExtractor.getPlaylist(playlistId, maxResults)

    const videos = results.map((video) => ({
      id: video.id,
      title: video.title,
      artist: video.artist,
      thumbnail: video.thumbnail,
      duration: video.duration,
      channelTitle: video.artist,
      publishedAt: new Date().toISOString(), // Default since ytdlp doesn't provide publish date
      viewCount: "1000000", // Default since ytdlp doesn't provide view count
      url: video.url,
      audioUrl: video.audioUrl,
      source: "ytdlp",
    }))

    return NextResponse.json({ videos })
  } catch (error) {
    console.error("Playlist API error:", error)
    return NextResponse.json({ error: "Failed to fetch playlist videos" }, { status: 500 })
  }
}
