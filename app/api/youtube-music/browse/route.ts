import { type NextRequest, NextResponse } from "next/server"
import { youtubeMusicBrowse } from "@/lib/youtube-music-browse"
import { YouTubeMusicAuth } from "@/lib/youtube-music-auth"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const section = searchParams.get("section") || "home"
    const useAuth = searchParams.get("useAuth") !== "false"

    console.log(`[v0] YouTube Music Browse API: Enhanced ${section} request`)

    let accessToken: string | undefined
    let ytmusicHeaders: Record<string, string> | undefined

    if (useAuth) {
      try {
        const user = await YouTubeMusicAuth.getAuthenticatedUser()
        if (user?.accessToken) {
          accessToken = user.accessToken
          ytmusicHeaders = user.ytmusicHeaders
          console.log(`[v0] Using authenticated browse for user: ${user.email}`)
        }
      } catch (error) {
        console.warn("[v0] Could not get authenticated user for browse:", error)
      }
    }

    let result
    switch (section) {
      case "home":
        result = await youtubeMusicBrowse.getHomeFeed(accessToken, ytmusicHeaders)
        break
      case "quick-picks":
        const quickPicks = await youtubeMusicBrowse.getQuickPicks(accessToken, ytmusicHeaders)
        result = { tracks: quickPicks, success: true }
        break
      case "new-releases":
        const newReleases = await youtubeMusicBrowse.getNewReleases(accessToken, ytmusicHeaders)
        result = { tracks: newReleases, success: true }
        break
      case "recommendations":
        const recommendations = await youtubeMusicBrowse.getRecommendations(accessToken, ytmusicHeaders)
        result = { tracks: recommendations, success: true }
        break
      default:
        result = await youtubeMusicBrowse.getHomeFeed(accessToken, ytmusicHeaders)
    }

    return NextResponse.json({
      success: true,
      authenticated: !!accessToken,
      ...result,
    })
  } catch (error) {
    console.error("[v0] YouTube Music Browse API error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      sections: [],
      tracks: [],
    })
  }
}
