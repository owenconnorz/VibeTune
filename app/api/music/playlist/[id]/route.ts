import { type NextRequest, NextResponse } from "next/server"
import { getPlaylistDetails } from "@/lib/innertube"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: "Playlist ID is required" }, { status: 400 })
    }

    console.log("[v0] Fetching YouTube playlist:", id)

    const playlist = await getPlaylistDetails(id)

    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    console.log("[v0] Playlist fetched successfully:", playlist.title, `(${playlist.videos.length} videos)`)

    return NextResponse.json(playlist)
  } catch (error) {
    console.error("[v0] Error fetching playlist:", error)
    return NextResponse.json({ error: "Failed to fetch playlist" }, { status: 500 })
  }
}
