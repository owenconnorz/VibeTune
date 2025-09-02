import { type NextRequest, NextResponse } from "next/server"
import { createPipedAPI } from "@/lib/piped-api"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const maxResults = Number.parseInt(searchParams.get("maxResults") || "20")

    if (!query) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
    }

    console.log("[v0] Piped API search called with query:", query, "maxResults:", maxResults)

    const pipedAPI = createPipedAPI()
    const results = await pipedAPI.search(query, maxResults)

    if (results.videos && results.videos.length > 0) {
      const songs = results.videos.map((video) => ({
        id: video.id,
        title: video.title,
        artist: video.artist,
        thumbnail: video.thumbnail,
        duration: video.duration,
        channelTitle: video.artist,
        publishedAt: video.publishedAt || new Date().toISOString(),
        viewCount: video.views || "1000000",
        url: video.url,
        audioUrl: video.audioUrl,
        source: "piped",
      }))

      return NextResponse.json({
        songs: songs.slice(0, maxResults),
        videos: songs.slice(0, maxResults),
        source: "piped",
        query,
      })
    }

    return NextResponse.json({
      songs: [],
      videos: [],
      source: "piped_no_results",
      query,
    })
  } catch (error) {
    console.error("[v0] Piped API search error:", error)
    return NextResponse.json(
      {
        error: "Failed to search music from Piped API",
        message: error.message,
        query: new URL(request.url).searchParams.get("q") || "",
      },
      { status: 500 },
    )
  }
}
