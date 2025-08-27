import { type NextRequest, NextResponse } from "next/server"
import { createMusicAPI } from "@/lib/youtube-data-api"

export const runtime = "edge"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const playlistId = searchParams.get("id")
    const maxResults = searchParams.get("maxResults") ? Number.parseInt(searchParams.get("maxResults")!) : undefined

    if (!playlistId) {
      return NextResponse.json({ error: "Playlist ID is required" }, { status: 400 })
    }

    const musicAPI = createMusicAPI()
    const results = await musicAPI.getTrending(maxResults || 20)

    const videos = results.tracks.map((track) => ({
      id: track.id,
      title: track.title,
      channelTitle: track.artist,
      thumbnail: track.thumbnail,
      duration: track.duration,
      viewCount: "1000000",
      publishedAt: new Date().toISOString(),
    }))

    return NextResponse.json(videos, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    })
  } catch (error) {
    console.error("[v0] Playlist API error:", error)
    return NextResponse.json({ error: "Failed to fetch playlist videos" }, { status: 500 })
  }
}
