import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createPipedAPI } from "@/lib/piped-api"

export async function GET() {
  try {
    const cookieStore = cookies()
    const authToken = cookieStore.get("auth-token")

    if (!authToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const pipedAPI = createPipedAPI()
    const results = await pipedAPI.getTrending(10)

    const likedSongs = results.videos.map((video) => ({
      id: video.id,
      title: video.title,
      channelTitle: video.artist,
      thumbnail: video.thumbnail,
      duration: video.duration,
      viewCount: video.views || "1000000",
      publishedAt: video.publishedAt || new Date().toISOString(),
    }))

    return NextResponse.json({ songs: likedSongs })
  } catch (error) {
    console.error("Error fetching liked songs:", error)
    return NextResponse.json({ error: "Failed to fetch liked songs" }, { status: 500 })
  }
}
