import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { YTMusic } = await import("ytmusic-api")
    const ytmusic = new YTMusic()
    await ytmusic.initialize()

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("query") || "hip hop classics"

    console.log(`[v0] Testing ytmusic-api search for: ${query}`)

    const searchResults = await ytmusic.searchSongs(query, {
      limit: 10,
    })

    console.log(`[v0] YTMusic API returned ${searchResults.length} results`)

    // Extract thumbnail information
    const thumbnailData = searchResults.map((song: any) => ({
      title: song.name,
      artist: song.artist?.name || "Unknown Artist",
      thumbnail: song.thumbnails?.[0]?.url || null,
      videoId: song.videoId,
      duration: song.duration?.text || "Unknown",
    }))

    return NextResponse.json({
      success: true,
      query,
      results: thumbnailData,
      count: thumbnailData.length,
    })
  } catch (error) {
    console.error("[v0] YTMusic API test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        query: request.nextUrl.searchParams.get("query") || "hip hop classics",
      },
      { status: 500 },
    )
  }
}
