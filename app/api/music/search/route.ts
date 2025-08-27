import { type NextRequest, NextResponse } from "next/server"
import { createYouTubeDataAPI } from "@/lib/youtube-data-api"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const maxResults = Number.parseInt(searchParams.get("maxResults") || "20")

    console.log("[v0] YouTube Data API v3 search called with query:", query, "maxResults:", maxResults)

    if (!query) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
    }

    console.log("[v0] Creating YouTube Data API v3 instance...")
    const youtubeAPI = createYouTubeDataAPI()
    console.log("[v0] YouTube Data API v3 created successfully, calling search...")

    const results = await youtubeAPI.search(query, maxResults)
    console.log("[v0] YouTube Data API v3 search completed:", {
      hasResults: !!results,
      hasTracks: !!results?.tracks,
      tracksLength: results?.tracks?.length || 0,
      firstResult: results?.tracks?.[0]
        ? {
            id: results.tracks[0].id,
            title: results.tracks[0].title,
            artist: results.tracks[0].artist,
          }
        : "no first result",
    })

    if (results.tracks && results.tracks.length > 0) {
      console.log("[v0] Processing YouTube Data API v3 results, first item:", results.tracks[0])
      const songs = results.tracks.map((track) => ({
        id: track.id,
        title: track.title,
        artist: track.artist,
        thumbnail: track.thumbnail,
        duration: track.duration,
        channelTitle: track.artist, // Keep for backward compatibility
        publishedAt: new Date().toISOString(),
        viewCount: "1000000",
        url: track.url,
        source: track.source,
      }))

      const response = NextResponse.json({
        songs: songs.slice(0, maxResults),
        videos: songs.slice(0, maxResults),
        source: "youtube_data_api_v3",
        query,
      })

      response.headers.set("Cache-Control", "public, s-maxage=1200, stale-while-revalidate=3600")
      response.headers.set("CDN-Cache-Control", "public, s-maxage=1200")
      response.headers.set("Vercel-CDN-Cache-Control", "public, s-maxage=1200")

      return response
    }

    console.log("[v0] No YouTube Data API v3 results found for query:", query)

    const response = NextResponse.json({
      songs: [],
      videos: [],
      source: "youtube_no_results",
      query,
    })

    response.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600")
    response.headers.set("CDN-Cache-Control", "public, s-maxage=300")
    response.headers.set("Vercel-CDN-Cache-Control", "public, s-maxage=300")

    return response
  } catch (error) {
    console.error("[v0] YouTube Data API v3 search error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      query: new URL(request.url).searchParams.get("q"),
    })

    const query = new URL(request.url).searchParams.get("q") || ""
    const maxResults = Number.parseInt(new URL(request.url).searchParams.get("maxResults") || "20")

    const response = NextResponse.json({
      songs: [],
      videos: [],
      source: "youtube_error_fallback",
      query,
      error: error.message,
    })

    response.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600")
    response.headers.set("CDN-Cache-Control", "public, s-maxage=300")
    response.headers.set("Vercel-CDN-Cache-Control", "public, s-maxage=300")

    return response
  }
}
