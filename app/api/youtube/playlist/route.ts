import { type NextRequest, NextResponse } from "next/server"
import { createYouTubeAPI } from "@/lib/youtube-api"

export const runtime = "edge"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const playlistId = searchParams.get("id")
    const maxResults = searchParams.get("maxResults") ? Number.parseInt(searchParams.get("maxResults")!) : undefined

    if (!playlistId) {
      return NextResponse.json({ error: "Playlist ID is required" }, { status: 400 })
    }

    const youtubeAPI = createYouTubeAPI(process.env.YOUTUBE_API_KEY)
    const results = await youtubeAPI.getPlaylistVideos(playlistId, maxResults)

    return NextResponse.json(results, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    })
  } catch (error) {
    console.error("[v0] YouTube playlist API error:", error)
    return NextResponse.json({ error: "Failed to fetch playlist videos" }, { status: 500 })
  }
}
