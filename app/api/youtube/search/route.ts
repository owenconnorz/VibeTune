import { type NextRequest, NextResponse } from "next/server"
import { createPipedAPI } from "@/lib/piped-api"

export const runtime = "edge"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const maxResults = Number.parseInt(searchParams.get("maxResults") || "20")

    if (!query) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
    }

    const pipedAPI = createPipedAPI()
    const results = await pipedAPI.search(query, maxResults)

    const videos = results.videos.map((video) => ({
      id: video.id,
      title: video.title,
      channelTitle: video.artist,
      thumbnail: video.thumbnail,
      duration: video.duration,
      viewCount: video.views || "1000000",
      publishedAt: video.publishedAt || new Date().toISOString(),
    }))

    return NextResponse.json(
      { videos },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    )
  } catch (error) {
    console.error("[v0] Piped search API error:", error)
    return NextResponse.json({ error: "Failed to search videos" }, { status: 500 })
  }
}
