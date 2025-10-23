import { type NextRequest, NextResponse } from "next/server"
import { generateSmartPlaylist, generateDiscoverWeekly, smartPlaylistTemplates } from "@/lib/smart-playlist-generator"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // Check if template exists
    const template = smartPlaylistTemplates.find((t) => t.id === id)
    if (!template) {
      return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 })
    }

    // Generate playlist
    let videos
    if (id === "discover-weekly") {
      videos = await generateDiscoverWeekly()
    } else {
      videos = await generateSmartPlaylist(id)
    }

    return NextResponse.json({
      success: true,
      playlist: {
        ...template,
        videos,
      },
    })
  } catch (error) {
    console.error("[v0] Error generating smart playlist:", error)
    return NextResponse.json({ success: false, error: "Failed to generate playlist" }, { status: 500 })
  }
}
