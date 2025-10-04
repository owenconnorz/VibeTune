import { NextRequest, NextResponse } from "next/server"
import { YouTubeMusicInnerTube } from "@/lib/youtube-music-innertube"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    // Get user's access token from cookies or headers
    const authHeader = request.headers.get("authorization")
    const accessToken = authHeader?.replace("Bearer ", "")

    if (!accessToken) {
      return NextResponse.json(
        { error: "Authentication required", playlists: [] },
        { status: 401 }
      )
    }

    console.log("[v0] Fetching user playlists from YouTube Music")

    // Fetch playlists using InnerTube API
    const playlists = await YouTubeMusicInnerTube.getLibraryPlaylists()

    return NextResponse.json({
      playlists: playlists || [],
      count: playlists?.length || 0,
      success: true,
    })
  } catch (error) {
    console.error("[v0] Error fetching playlists:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch playlists",
        playlists: [],
      },
      { status: 500 }
    )
  }
}