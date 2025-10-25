import { type NextRequest, NextResponse } from "next/server"
import { searchMusic } from "@/lib/youtube-api"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const artistName = searchParams.get("artist")

  if (!artistName) {
    return NextResponse.json({ error: "Missing artist parameter" }, { status: 400 })
  }

  try {
    console.log("[v0] Finding similar artists to:", artistName)

    // Search for related artists and songs
    // In a production app, you'd use a proper music API with artist relationships
    const searchQuery = `${artistName} similar artists music`
    const result = await searchMusic(searchQuery, undefined)

    return NextResponse.json({
      artists: result.videos.slice(0, 10),
      sourceArtist: artistName,
    })
  } catch (error) {
    console.error("[v0] Error finding similar artists:", error)
    return NextResponse.json({ error: "Failed to find similar artists" }, { status: 500 })
  }
}
