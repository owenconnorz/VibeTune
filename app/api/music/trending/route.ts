import { type NextRequest, NextResponse } from "next/server"
import { createYtDlpExtractor } from "@/lib/ytdlp-extractor"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const maxResults = Number.parseInt(searchParams.get("maxResults") || "20")

    console.log("[v0] Music trending API called with maxResults:", maxResults)

    const ytdlp = createYtDlpExtractor()
    const results = await ytdlp.getTrending(maxResults)

    if (results && results.length > 0) {
      const songs = results.map((song) => ({
        id: song.id,
        title: song.title,
        artist: song.artist,
        thumbnail: song.thumbnail,
        duration: song.duration,
        channelTitle: song.artist,
        publishedAt: new Date().toISOString(),
        viewCount: "1000000",
        url: song.url,
        audioUrl: song.audioUrl,
        source: "ytdlp",
      }))

      console.log("[v0] Music trending: Returning data, count:", songs.length)

      const response = NextResponse.json({
        songs: songs.slice(0, maxResults),
        videos: songs.slice(0, maxResults),
        source: "ytdlp",
      })

      response.headers.set("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=3600")
      return response
    }

    return NextResponse.json({
      songs: [],
      videos: [],
      source: "ytdlp_no_results",
    })
  } catch (error) {
    console.error("[v0] Music trending error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch trending music from yt-dlp",
        message: error.message,
      },
      { status: 500 },
    )
  }
}
