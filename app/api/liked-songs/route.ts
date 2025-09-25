import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { ytDlpExtractor } from "@/lib/ytdlp-extractor"

export const runtime = "nodejs"

export async function GET() {
  try {
    const cookieStore = cookies()
    const authToken = cookieStore.get("auth-token")

    if (!authToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const results = await ytDlpExtractor.getTrending(10)

    const likedSongs = results.map((video) => ({
      id: video.id,
      title: video.title,
      channelTitle: video.artist,
      thumbnail: video.thumbnail,
      duration: video.duration,
      viewCount: "1000000", // Default since ytdlp doesn't provide view count
      publishedAt: new Date().toISOString(), // Default since ytdlp doesn't provide publish date
    }))

    return NextResponse.json({ songs: likedSongs })
  } catch (error) {
    console.error("Error fetching liked songs:", error)
    return NextResponse.json({ error: "Failed to fetch liked songs" }, { status: 500 })
  }
}
