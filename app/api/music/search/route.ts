import { type NextRequest, NextResponse } from "next/server"
import { createYtDlpExtractor } from "@/lib/ytdlp-extractor"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const maxResults = Number.parseInt(searchParams.get("maxResults") || "20")

    if (!query) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
    }

    console.log("[v0] Music search API called with query:", query, "maxResults:", maxResults)

    const ytdlp = createYtDlpExtractor()
    const results = await ytdlp.search(query, maxResults)

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

      return NextResponse.json({
        songs: songs.slice(0, maxResults),
        videos: songs.slice(0, maxResults),
        source: "ytdlp",
        query,
      })
    }

    return NextResponse.json({
      songs: [],
      videos: [],
      source: "ytdlp_no_results",
      query,
    })
  } catch (error) {
    console.error("[v0] Music search error:", error)
    return NextResponse.json(
      {
        error: "Failed to search music from yt-dlp",
        message: error.message,
        query: new URL(request.url).searchParams.get("q") || "",
      },
      { status: 500 },
    )
  }
}
