import { type NextRequest, NextResponse } from "next/server"
import { createPipedAPI } from "@/lib/piped-api"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const maxResults = Number.parseInt(searchParams.get("maxResults") || "20")

    console.log("[v0] Piped API trending called with maxResults:", maxResults)

    const pipedAPI = createPipedAPI()
    const results = await pipedAPI.getTrending(maxResults)

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

      console.log("[v0] Piped API trending: Returning data, count:", songs.length)

      const response = NextResponse.json({
        songs: songs.slice(0, maxResults),
        videos: songs.slice(0, maxResults),
        source: "piped",
      })

      response.headers.set("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=3600")
      return response
    }

    return NextResponse.json({
      songs: [],
      videos: [],
      source: "piped_no_results",
    })
  } catch (error) {
    console.error("[v0] Piped API trending error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch trending music from Piped API",
        message: error.message,
      },
      { status: 500 },
    )
  }
}
