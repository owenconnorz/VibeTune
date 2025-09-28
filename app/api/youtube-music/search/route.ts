import { type NextRequest, NextResponse } from "next/server"
import { youtubeMusicScraper } from "@/lib/youtube-music-scraper"
import { YouTubeMusicAuth } from "@/lib/youtube-music-auth"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query") || searchParams.get("q") || ""
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const type = searchParams.get("type") || "all"
    const useAuth = searchParams.get("useAuth") !== "false"
    const fallback = searchParams.get("fallback") !== "false"

    console.log(`[v0] YouTube Music API: Enhanced search request:`, { query, page, limit, type, useAuth })

    if (!query.trim()) {
      return NextResponse.json({
        success: false,
        error: "Query parameter is required",
        tracks: [],
        totalCount: 0,
        hasNextPage: false,
      })
    }

    let accessToken: string | undefined
    if (useAuth) {
      try {
        const user = await YouTubeMusicAuth.getAuthenticatedUser()
        if (user?.accessToken) {
          accessToken = user.accessToken
          console.log(`[v0] Using authenticated search for user: ${user.email}`)
        }
      } catch (error) {
        console.warn("[v0] Could not get authenticated user for search:", error)
      }
    }

    const result = await youtubeMusicScraper.search(query, page, limit, {
      type: type as any,
      useAuth,
      fallbackToOldAPI: fallback,
      accessToken,
    })

    console.log(`[v0] YouTube Music API: Enhanced search response: ${result.tracks.length} tracks`)

    return NextResponse.json({
      success: true,
      query,
      page,
      limit,
      type,
      authenticated: !!accessToken,
      tracks: result.tracks,
      totalCount: result.totalCount,
      hasNextPage: result.hasNextPage,
    })
  } catch (error) {
    console.error("[v0] YouTube Music API enhanced search error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      tracks: [],
      totalCount: 0,
      hasNextPage: false,
    })
  }
}
