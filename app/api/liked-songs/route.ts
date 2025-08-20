import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createYouTubeAPI } from "@/lib/youtube-api"

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY

export async function GET() {
  try {
    if (!YOUTUBE_API_KEY) {
      return NextResponse.json({ error: "YouTube API not configured" }, { status: 500 })
    }

    // Get user from session
    const cookieStore = cookies()
    const authToken = cookieStore.get("auth-token")

    if (!authToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const user = JSON.parse(authToken.value)

    if (!user.accessToken) {
      return NextResponse.json({ error: "No access token" }, { status: 401 })
    }

    const youtubeAPI = createYouTubeAPI(YOUTUBE_API_KEY)
    const likedSongs = await youtubeAPI.getLikedVideos(user.accessToken)

    return NextResponse.json({ songs: likedSongs })
  } catch (error) {
    console.error("Error fetching liked songs:", error)
    return NextResponse.json({ error: "Failed to fetch liked songs" }, { status: 500 })
  }
}
