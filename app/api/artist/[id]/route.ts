import { type NextRequest, NextResponse } from "next/server"
import { getArtistData } from "@/lib/innertube"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const artistId = params.id

    console.log("[v0] Artist API - Fetching data for ID:", artistId)

    // YouTube Music artist browse IDs typically start with "UC" or "MPLA"
    const artistData = await getArtistData(artistId)

    console.log("[v0] Artist API - Successfully fetched data")
    console.log("[v0] Artist API - Has albums:", artistData.albums?.length || 0)
    console.log("[v0] Artist API - Has singles:", artistData.singles?.length || 0)
    console.log("[v0] Artist API - Has videos:", artistData.videos?.length || 0)
    console.log("[v0] Artist API - Has live performances:", artistData.livePerformances?.length || 0)
    console.log("[v0] Artist API - Has featured on:", artistData.featuredOn?.length || 0)
    console.log("[v0] Artist API - Has playlists:", artistData.playlists?.length || 0)
    console.log("[v0] Artist API - Has related artists:", artistData.relatedArtists?.length || 0)

    return NextResponse.json({ artist: artistData })
  } catch (error) {
    console.error("[v0] Artist API - Error fetching artist:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch artist data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
