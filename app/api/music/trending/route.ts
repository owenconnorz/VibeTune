import { type NextRequest, NextResponse } from "next/server"
import { createYouTubeDataAPI } from "@/lib/youtube-data-api"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const maxResults = Number.parseInt(searchParams.get("maxResults") || "20")

    console.log("[v0] YouTube Data API v3 trending called with maxResults:", maxResults)

    console.log("[v0] YouTube Data API v3 trending: Creating YouTube API instance")

    const youtubeAPI = createYouTubeDataAPI()
    console.log("[v0] YouTube Data API v3 trending: YouTube API instance created")

    const results = await youtubeAPI.getTrending(maxResults)
    console.log("[v0] YouTube Data API v3 trending: YouTube API results:", {
      hasTracks: !!results.tracks,
      trackCount: results.tracks?.length || 0,
      firstTrackTitle: results.tracks?.[0]?.title || "none",
    })

    if (results.tracks && results.tracks.length > 0) {
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

      console.log("[v0] YouTube Data API v3 trending: Returning YouTube data, count:", songs.length)

      const response = NextResponse.json({
        songs: songs.slice(0, maxResults),
        videos: songs.slice(0, maxResults),
        source: "youtube_data_api_v3",
      })

      response.headers.set("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=3600")
      response.headers.set("CDN-Cache-Control", "public, s-maxage=1800")
      response.headers.set("Vercel-CDN-Cache-Control", "public, s-maxage=1800")

      return response
    }

    console.log("[v0] YouTube Data API v3 trending: No YouTube results")

    const response = NextResponse.json({
      songs: [],
      videos: [],
      source: "youtube_no_results",
    })

    response.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600")
    response.headers.set("CDN-Cache-Control", "public, s-maxage=300")
    response.headers.set("Vercel-CDN-Cache-Control", "public, s-maxage=300")

    return response
  } catch (error) {
    console.error("[v0] YouTube Data API v3 trending error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })

    // Return empty results on error
    const maxResults = Number.parseInt(new URL(request.url).searchParams.get("maxResults") || "20")
    console.log("[v0] YouTube Data API v3 trending: Error occurred, returning empty results")

    const response = NextResponse.json({
      songs: [],
      videos: [],
      source: "youtube_error_fallback",
      error: error.message,
    })

    response.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600")
    response.headers.set("CDN-Cache-Control", "public, s-maxage=300")
    response.headers.set("Vercel-CDN-Cache-Control", "public, s-maxage=300")

    return response
  }
}
