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
    console.log("[v0] Original ID:", id)

    let isAlbum = false
    let cleanId = id

    if (id.startsWith("VL")) {
      cleanId = id.substring(2)
      console.log("[v0] Stripped VL prefix, new ID:", cleanId)
    } else if (id.startsWith("MPRE")) {
      isAlbum = true
      console.log("[v0] Album browse ID detected")
    }

    const cacheKey = `playlist_${cleanId}`
    const cachedPlaylist = cache.get(cacheKey)

    if (cachedPlaylist) {
      console.log("[v0] ===== PLAYLIST LOADED FROM CACHE =====")
      console.log("[v0] Playlist title:", cachedPlaylist.title)
      console.log("[v0] Video count:", cachedPlaylist.videos?.length || 0)
      return NextResponse.json(cachedPlaylist)
    }

    console.log("[v0] Cache miss, fetching from YouTube...")

    const playlist = await getPlaylistDetails(cleanId)

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
  } catch (error: any) {
    console.error("[v0] ===== PLAYLIST API ERROR =====")
    console.error("[v0] Error:", error?.message)
    console.error("[v0] Stack:", error?.stack)
    return NextResponse.json({ error: "Failed to fetch playlist" }, { status: 500 })
  }
}
