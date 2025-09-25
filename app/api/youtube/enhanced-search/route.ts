import { type NextRequest, NextResponse } from "next/server"
import { ytDlpExtractor } from "@/lib/ytdlp-extractor"

export const runtime = "edge"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const maxResults = Number.parseInt(searchParams.get("maxResults") || "20")

    if (!query) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
    }

    const results = await ytDlpExtractor.search(query, maxResults)

    const songs = results.map((video) => ({
      id: video.id,
      title: video.title,
      channelTitle: video.artist,
      thumbnail: video.thumbnail,
      duration: video.duration,
      viewCount: "1000000",
      publishedAt: new Date().toISOString(),
    }))

    const enhancedResults = {
      songs,
      artists: [],
      albums: [],
      playlists: [],
      nextPageToken: undefined,
    }

    return NextResponse.json(enhancedResults, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    })
  } catch (error) {
    console.error("[v0] YtDlp enhanced search API error:", error)
    return NextResponse.json({ error: "Failed to perform enhanced search" }, { status: 500 })
  }
}
