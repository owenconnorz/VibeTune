import { NextRequest, NextResponse } from "next/server"
import { libreMusicAPI } from "@/lib/libre-music-api"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("query") || searchParams.get("q")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter is required" },
        { status: 400 }
      )
    }

    console.log("[v0] Libre.fm API: Searching for:", query)

    const results = await libreMusicAPI.search(query, page, limit)

    return NextResponse.json({
      tracks: results.tracks,
      totalCount: results.totalCount,
      hasNextPage: results.hasNextPage,
      source: "libre",
      success: !results.error,
      error: results.error,
    })
  } catch (error) {
    console.error("[v0] Libre.fm API search error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Search failed",
        tracks: [],
      },
      { status: 500 }
    )
  }
}