import { NextResponse } from "next/server"
import { YouTubeMusicAuth } from "@/lib/youtube-music-auth"

export async function GET() {
  try {
    const user = await YouTubeMusicAuth.getAuthenticatedUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Remove sensitive tokens from response
    const { accessToken, refreshToken, ytmusicCookies, ytmusicHeaders, ...safeUser } = user

    return NextResponse.json({
      ...safeUser,
      hasYouTubeMusicAccess: !!(ytmusicCookies || ytmusicHeaders),
    })
  } catch (error) {
    console.error("[v0] Error getting authenticated user:", error)
    return NextResponse.json({ error: "Invalid session" }, { status: 401 })
  }
}
