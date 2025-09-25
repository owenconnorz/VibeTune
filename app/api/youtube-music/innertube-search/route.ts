import { type NextRequest, NextResponse } from "next/server"
import { YouTubeMusicInnerTube } from "@/lib/youtube-music-innertube"
import { YouTubeMusicParser } from "@/lib/youtube-music-parser"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query") || searchParams.get("q") || ""
    const type = searchParams.get("type") || "all"
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    if (!query.trim()) {
      return NextResponse.json({
        success: false,
        error: "Query parameter is required",
        results: {
          songs: [],
          videos: [],
          artists: [],
          albums: [],
          playlists: [],
        },
      })
    }

    console.log(`[v0] YouTube Music InnerTube Search: "${query}" (type: ${type}, page: ${page})`)

    let searchData: any

    switch (type) {
      case "songs":
        searchData = await YouTubeMusicInnerTube.searchSongs(query)
        break
      case "videos":
        searchData = await YouTubeMusicInnerTube.searchVideos(query)
        break
      case "artists":
        searchData = await YouTubeMusicInnerTube.searchArtists(query)
        break
      case "albums":
        searchData = await YouTubeMusicInnerTube.searchAlbums(query)
        break
      case "playlists":
        searchData = await YouTubeMusicInnerTube.searchPlaylists(query)
        break
      default:
        searchData = await YouTubeMusicInnerTube.search(query)
        break
    }

    const results = YouTubeMusicParser.parseSearchResults(searchData)

    // Combine all results for 'all' type
    const allResults = [
      ...results.songs,
      ...results.videos,
      ...results.artists,
      ...results.albums,
      ...results.playlists,
    ]

    console.log(`[v0] YouTube Music InnerTube Search: Found ${allResults.length} total results`)

    return NextResponse.json({
      success: true,
      query,
      type,
      page,
      results,
      totalResults: allResults.length,
      hasMore: allResults.length >= limit,
    })
  } catch (error) {
    console.error("[v0] YouTube Music InnerTube Search error:", error)

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Search failed",
      results: {
        songs: [],
        videos: [],
        artists: [],
        albums: [],
        playlists: [],
      },
    })
  }
}
