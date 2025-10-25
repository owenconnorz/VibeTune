import { type NextRequest, NextResponse } from "next/server"
import { searchMusic } from "@/lib/youtube-api"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const artists = searchParams.get("artists")?.split(",") || []
  const type = searchParams.get("type") || "mix"

  try {
    console.log("[v0] Generating recommendations for artists:", artists)

    if (artists.length === 0) {
      // Return trending if no artists provided
      return NextResponse.json({ videos: [] })
    }

    // Search for songs by top artists
    const searchPromises = artists.slice(0, 3).map((artist) => searchMusic(`${artist} official audio`, undefined))

    const results = await Promise.all(searchPromises)

    // Combine and shuffle results
    const allVideos = results.flatMap((r) => r.videos)
    const shuffled = allVideos.sort(() => Math.random() - 0.5)

    // Return up to 20 recommendations
    return NextResponse.json({
      videos: shuffled.slice(0, 20),
      playlistName: type === "mix" ? "Your Daily Mix" : "Discover Weekly",
    })
  } catch (error) {
    console.error("[v0] Error generating recommendations:", error)
    return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 })
  }
}
