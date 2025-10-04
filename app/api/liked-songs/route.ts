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
        { error: "Authentication required", songs: [] },
        { status: 401 }
      )
    }

    console.log("[v0] Fetching liked songs from YouTube Music")

    // Fetch liked songs using InnerTube API
    const likedSongs = await YouTubeMusicInnerTube.getLikedSongs()

    return NextResponse.json({
      songs: likedSongs || [],
      count: likedSongs?.length || 0,
      success: true,
    })
  } catch (error) {
    console.error("[v0] Error fetching liked songs:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch liked songs",
        songs: [],
      },
      { status: 500 }
    )
  }
}