import { type NextRequest, NextResponse } from "next/server"
import { ytDlpExtractor } from "@/lib/ytdlp-extractor"

export const runtime = "nodejs"

export async function GET(request: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  try {
    const resolvedParams = await params
    const artistName = decodeURIComponent(resolvedParams.name)
    const { searchParams } = new URL(request.url)
    const maxResults = Number.parseInt(searchParams.get("maxResults") || "20")

    if (!artistName) {
      return NextResponse.json({ error: "Artist name is required" }, { status: 400 })
    }

    console.log("[v0] Searching for artist:", artistName)
    const results = await ytDlpExtractor.search(artistName, maxResults)

    const songs = results.map((song) => ({
      id: song.id,
      title: song.title || "Unknown Title",
      artist: song.artist || artistName,
      thumbnail: song.thumbnail,
      duration: song.duration,
    }))

    return NextResponse.json(
      { songs },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    )
  } catch (error) {
    console.error("[v0] Artist API error:", error)
    return NextResponse.json({ error: "Failed to load artist songs" }, { status: 500 })
  }
}
