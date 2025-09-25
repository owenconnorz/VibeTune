import { type NextRequest, NextResponse } from "next/server"
import { youtubeMusicBrowse } from "@/lib/youtube-music-browse"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const section = searchParams.get("section") || "home"

    console.log(`[v0] YouTube Music Browse API: ${section} request`)

    let result
    switch (section) {
      case "home":
        result = await youtubeMusicBrowse.getHomeFeed()
        break
      case "quick-picks":
        const quickPicks = await youtubeMusicBrowse.getQuickPicks()
        result = { tracks: quickPicks, success: true }
        break
      case "new-releases":
        const newReleases = await youtubeMusicBrowse.getNewReleases()
        result = { tracks: newReleases, success: true }
        break
      case "recommendations":
        const recommendations = await youtubeMusicBrowse.getRecommendations()
        result = { tracks: recommendations, success: true }
        break
      default:
        result = await youtubeMusicBrowse.getHomeFeed()
    }

    return NextResponse.json({
      success: true,
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
