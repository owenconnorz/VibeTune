import { type NextRequest, NextResponse } from "next/server"
import { createMusicAPI } from "@/lib/youtube-data-api"

export const runtime = "edge"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const maxResults = Number.parseInt(searchParams.get("maxResults") || "20")

    const musicAPI = createMusicAPI()
    const results = await musicAPI.getTrending(maxResults)

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
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
      },
    })
  } catch (error) {
    console.error("[v0] Music trending API error:", error)
    return NextResponse.json({ error: "Failed to fetch trending music" }, { status: 500 })
  }
}
