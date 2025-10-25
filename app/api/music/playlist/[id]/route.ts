import { type NextRequest, NextResponse } from "next/server"
import { getPlaylistDetails } from "@/lib/innertube"
import { cache } from "@/lib/cache"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: "Playlist ID is required" }, { status: 400 })
    }

    console.log("[v0] ===== PLAYLIST API REQUEST =====")
    console.log("[v0] Requested playlist ID:", id)

    const cacheKey = `playlist_${id}`
    const cachedPlaylist = cache.get(cacheKey)

    if (cachedPlaylist) {
      console.log("[v0] ===== PLAYLIST LOADED FROM CACHE =====")
      console.log("[v0] Playlist title:", cachedPlaylist.title)
      console.log("[v0] Video count:", cachedPlaylist.videos?.length || 0)
      return NextResponse.json(cachedPlaylist)
    }

    console.log("[v0] Cache miss, fetching from YouTube...")
    const playlist = await getPlaylistDetails(id)

    if (!playlist) {
      console.error("[v0] Playlist not found or returned null")
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
    }

    cache.set(cacheKey, playlist)

    console.log("[v0] ===== PLAYLIST API SUCCESS =====")
    console.log("[v0] Playlist title:", playlist.title)
    console.log("[v0] Video count:", playlist.videos.length)
    console.log("[v0] Cached for future requests")

    return NextResponse.json(playlist)
  } catch (error) {
    console.error("[v0] ===== PLAYLIST API ERROR =====")
    console.error("[v0] Error:", error)
    return NextResponse.json({ error: "Failed to fetch playlist" }, { status: 500 })
  }
}
