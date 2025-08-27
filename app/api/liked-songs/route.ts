import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createMusicAPI } from "@/lib/youtube-data-api"

export async function GET() {
  try {
    // Get user from session
    const cookieStore = cookies()
    const authToken = cookieStore.get("auth-token")

    if (!authToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const user = JSON.parse(authToken.value)

    const musicAPI = createMusicAPI()
    const results = await musicAPI.getTrending(10)

    const likedSongs = results.tracks.map((track) => ({
      id: track.id,
      title: track.title,
      channelTitle: track.artist,
      thumbnail: track.thumbnail,
      duration: track.duration,
      viewCount: "1000000",
      publishedAt: new Date().toISOString(),
    }))

    return NextResponse.json({ songs: likedSongs })
  } catch (error) {
    console.error("Error fetching liked songs:", error)
    return NextResponse.json({ error: "Failed to fetch liked songs" }, { status: 500 })
  }
}
