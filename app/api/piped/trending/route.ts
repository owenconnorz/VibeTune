import { type NextRequest, NextResponse } from "next/server"
import { createPipedAPI } from "@/lib/piped-api"

export const runtime = "edge"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const maxResults = Number.parseInt(searchParams.get("maxResults") || "20")

    console.log("[v0] Server-side Piped trending API called with maxResults:", maxResults)

    const pipedAPI = createPipedAPI()
    const result = await pipedAPI.getTrending(maxResults)

    console.log("[v0] Server-side Piped API: Returning data, count:", result.videos.length)

    const response = NextResponse.json({
      songs: result.videos,
      videos: result.videos,
      source: "piped",
    })

    response.headers.set("Cache-Control", "public, s-maxage=600, stale-while-revalidate=1800")
    response.headers.set("CDN-Cache-Control", "public, s-maxage=600")
    response.headers.set("Vercel-CDN-Cache-Control", "public, s-maxage=600")

    return response
  } catch (error) {
    console.error("[v0] Server-side Piped trending API error:", error)

    return NextResponse.json(
      {
        error: "Failed to fetch trending music from Piped API",
        message: error.message,
      },
      { status: 500 },
    )
  }
}
