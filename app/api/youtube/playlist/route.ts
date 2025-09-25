import { type NextRequest, NextResponse } from "next/server"
import { ytDlpExtractor } from "@/lib/ytdlp-extractor"

export const runtime = "edge"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const playlistId = searchParams.get("id")
    const maxResults = searchParams.get("maxResults") ? Number.parseInt(searchParams.get("maxResults")!) : undefined

    if (!playlistId) {
      return NextResponse.json({ error: "Playlist ID is required" }, { status: 400 })
    }

    const results = await ytDlpExtractor.search(`playlist:${playlistId}`, maxResults || 20)

    const videos = results.map((video) => ({
      id: video.id,
      title: video.title,
      channelTitle: video.artist,
      thumbnail: video.thumbnail,
      duration: video.duration,
      viewCount: "1000000",
      publishedAt: new Date().toISOString(),
    }))

    return NextResponse.json(videos, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    })
  } catch (error) {
    console.error("[v0] YtDlp playlist API error:", error)
    return NextResponse.json({ error: "Failed to fetch playlist videos" }, { status: 500 })
  }
}
