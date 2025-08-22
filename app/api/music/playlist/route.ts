import { type NextRequest, NextResponse } from "next/server"
import { createInnertubeAPI } from "@/lib/innertube-api"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const playlistId = searchParams.get("playlistId")
    const maxResults = Number.parseInt(searchParams.get("maxResults") || "50")

    if (!playlistId) {
      return NextResponse.json({ error: "Playlist ID is required" }, { status: 400 })
    }

    const innertube = createInnertubeAPI()
    const result = await innertube.getPlaylistDetails(playlistId)

    return NextResponse.json({ videos: result.videos })
  } catch (error) {
    console.error("Playlist API error:", error)
    return NextResponse.json({ error: "Failed to fetch playlist videos" }, { status: 500 })
  }
}
