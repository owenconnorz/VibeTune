import { type NextRequest, NextResponse } from "next/server"
import { getArtistData } from "@/lib/innertube"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const artistId = params.id

  try {
    console.log("[v0] Artist API: Fetching artist data for:", artistId)

    const artistData = await getArtistData(artistId)

    console.log("[v0] Artist API: Successfully fetched artist data")
    console.log("[v0] Artist API: Top songs:", artistData.topSongs.length)
    console.log("[v0] Artist API: Albums:", artistData.albums.length)
    console.log("[v0] Artist API: Videos:", artistData.videos.length)
    console.log("[v0] Artist API: Singles:", artistData.singles.length)

    return NextResponse.json(
      { artist: artistData },
      {
        headers: {
          "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
        },
      },
    )
  } catch (error) {
    console.error("[v0] Artist API error:", error)
    return NextResponse.json({ error: "Failed to fetch artist" }, { status: 500 })
  }
}
