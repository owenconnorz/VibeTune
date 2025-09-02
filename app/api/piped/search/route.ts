import { type NextRequest, NextResponse } from "next/server"
import { createPipedAPI } from "@/lib/piped-api"

export const runtime = "edge"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const maxResults = Number.parseInt(searchParams.get("maxResults") || "20")

    console.log("[v0] Server-side Piped search API called with query:", query, "maxResults:", maxResults)

    if (!query) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
    }

    const pipedAPI = createPipedAPI()
    const result = await pipedAPI.search(query, maxResults)

    console.log("[v0] Server-side Piped API: Found", result.videos.length, "results for query:", query)

    const response = NextResponse.json({
      songs: result.videos,
      videos: result.videos,
      source: "piped",
      query,
    })

    response.headers.set("Cache-Control", "public, s-maxage=600, stale-while-revalidate=1800")
    response.headers.set("CDN-Cache-Control", "public, s-maxage=600")
    response.headers.set("Vercel-CDN-Cache-Control", "public, s-maxage=600")

    return response
  } catch (error) {
    console.error("[v0] Server-side Piped search API error:", error)

    const query = new URL(request.url).searchParams.get("q") || ""

    return NextResponse.json(
      {
        error: "Failed to search music from Piped API",
        message: error.message,
        query,
      },
      { status: 500 },
    )
  }
}
