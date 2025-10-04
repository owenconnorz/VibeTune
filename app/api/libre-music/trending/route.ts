import { NextRequest, NextResponse } from "next/server"
import { libreMusicAPI } from "@/lib/libre-music-api"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get("limit") || "20")

    console.log("[v0] Libre.fm API: Getting top tracks")

    const results = await libreMusicAPI.getTopTracks(limit)

    return NextResponse.json({
      tracks: results.tracks,
      totalCount: results.totalCount,
      source: "libre",
      success: !results.error,
      error: results.error,
    })
  } catch (error) {
    console.error("[v0] Libre.fm API trending error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to get trending tracks",
        tracks: [],
      },
      { status: 500 }
    )
  }
}