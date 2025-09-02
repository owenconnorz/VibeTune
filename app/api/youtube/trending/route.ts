import { type NextRequest, NextResponse } from "next/server"
import { createPipedAPI } from "@/lib/piped-api"

export const runtime = "edge"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const maxResults = Number.parseInt(searchParams.get("maxResults") || "20")

    const pipedAPI = createPipedAPI()
    const results = await pipedAPI.getTrending(maxResults)

    const videos = results.videos.map((video) => ({
      id: video.id,
      title: video.title,
      channelTitle: video.artist,
      thumbnail: video.thumbnail,
      duration: video.duration,
      viewCount: video.views || "1000000",
      publishedAt: video.publishedAt || new Date().toISOString(),
    }))

    return NextResponse.json(videos, {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
      },
    })
  } catch (error) {
    console.error("[v0] Piped trending API error:", error)
    return NextResponse.json({ error: "Failed to fetch trending videos" }, { status: 500 })
  }
}
