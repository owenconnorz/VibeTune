import { NextResponse } from "next/server"
import { getPlaylistData } from "@/lib/innertube"

export async function POST(request: Request) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ success: false, error: "URL is required" }, { status: 400 })
    }

    // Extract playlist ID from URL
    // Supports formats:
    // - https://music.youtube.com/playlist?list=PLXXXXXX
    // - https://www.youtube.com/playlist?list=PLXXXXXX
    // - PLXXXXXX (direct ID)
    let playlistId = url

    const urlMatch = url.match(/[?&]list=([^&]+)/)
    if (urlMatch) {
      playlistId = urlMatch[1]
    }

    // Remove VL prefix if present
    if (playlistId.startsWith("VL")) {
      playlistId = playlistId.substring(2)
    }

    console.log("[v0] Importing playlist:", playlistId)

    const playlistData = await getPlaylistData(playlistId)

    return NextResponse.json({
      success: true,
      playlist: {
        name: playlistData.name,
        description: playlistData.description,
        coverImage: playlistData.thumbnail,
        videos: playlistData.songs,
      },
    })
  } catch (error: any) {
    console.error("[v0] Error importing playlist:", error)
    return NextResponse.json({ success: false, error: error.message || "Failed to import playlist" }, { status: 500 })
  }
}
