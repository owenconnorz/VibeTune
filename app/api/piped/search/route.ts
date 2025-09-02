import { type NextRequest, NextResponse } from "next/server"
import { createPipedAPI } from "@/lib/piped-api"

export const runtime = "edge"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const maxResults = Number.parseInt(searchParams.get("maxResults") || "20")

    console.log("[v0] Piped API search called with query:", query, "maxResults:", maxResults)

    if (!query) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
    }

    const pipedAPI = createPipedAPI()
    const results = await pipedAPI.search(query, maxResults)

    console.log("[v0] Piped API search results:", {
      hasVideos: !!results.videos,
      videoCount: results.videos?.length || 0,
      firstVideoTitle: results.videos?.[0]?.title || "none",
    })

    if (results.videos && results.videos.length > 0) {
      const songs = results.videos.map((video) => ({
        id: video.id,
        title: video.title,
        artist: video.artist,
        thumbnail: video.thumbnail,
        duration: video.duration,
        channelTitle: video.artist,
        publishedAt: video.publishedAt || new Date().toISOString(),
        viewCount: video.views || "1000000",
        url: video.url,
        audioUrl: video.audioUrl,
        source: "piped",
      }))

      console.log("[v0] Piped API search: Returning Piped data, count:", songs.length)

      const response = NextResponse.json({
        songs: songs.slice(0, maxResults),
        videos: songs.slice(0, maxResults),
        source: "piped_api",
        query,
      })

      response.headers.set("Cache-Control", "public, s-maxage=600, stale-while-revalidate=1800")
      response.headers.set("CDN-Cache-Control", "public, s-maxage=600")
      response.headers.set("Vercel-CDN-Cache-Control", "public, s-maxage=600")

      return response
    }

    console.log("[v0] Piped API search: No results for query:", query)

    const response = NextResponse.json({
      songs: [],
      videos: [],
      source: "piped_no_results",
      query,
    })

    response.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600")
    return response
  } catch (error) {
    console.error("[v0] Piped API search error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      query: new URL(request.url).searchParams.get("q"),
    })

    const query = new URL(request.url).searchParams.get("q") || ""

    const response = NextResponse.json({
      songs: [],
      videos: [],
      source: "piped_error_fallback",
      query,
      error: error.message,
    })

    response.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600")
    return response
  }
}
