import { NextResponse } from "next/server"
import { YouTubeMusicAuth } from "@/lib/youtube-music-auth"

export async function POST() {
  try {
    const user = await YouTubeMusicAuth.getAuthenticatedUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    console.log("[v0] Token refresh successful for user:", user.email)
    return NextResponse.json({
      accessToken: user.accessToken,
      hasYouTubeMusicAccess: !!(user.ytmusicCookies || user.ytmusicHeaders),
    })
  } catch (error) {
    console.error("[v0] Error refreshing token:", error)
    return NextResponse.json({ error: "Token refresh failed" }, { status: 500 })
  }
}
