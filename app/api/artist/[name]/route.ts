import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { name: string } }) {
  try {
    const artistName = decodeURIComponent(params.name)
    const maxResults = Number.parseInt(request.nextUrl.searchParams.get("maxResults") || "20")

    console.log("[v0] Artist API: Searching for artist:", artistName)

    // Search for songs by this artist using YouTube Music API
    const searchQuery = `${artistName} songs`
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/youtube-music/search?query=${encodeURIComponent(searchQuery)}&type=songs&limit=${maxResults}`
    )

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`)
    }

    const data = await response.json()
    const songs = (data.tracks || []).map((track: any) => ({
      id: track.id,
      title: track.title,
      artist: track.artist || artistName,
      thumbnail: track.thumbnail,
      duration: track.duration,
    }))

    return NextResponse.json({
      songs,
      artist: artistName,
      count: songs.length,
    })
  } catch (error) {
    console.error("[v0] Artist API error:", error)
    
    return NextResponse.json({
      songs: [],
      artist: params.name,
      count: 0,
      error: error instanceof Error ? error.message : "Failed to load artist songs",
    })
  }
}