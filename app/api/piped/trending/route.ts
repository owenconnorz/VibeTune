import { type NextRequest, NextResponse } from "next/server"
import { createPipedAPI } from "@/lib/piped-api"

export const runtime = "edge"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const maxResults = Number.parseInt(searchParams.get("maxResults") || "20")

    console.log("[v0] Server-side Piped trending API called with maxResults:", maxResults)

    const pipedAPI = createPipedAPI()

    if (!pipedAPI) {
      console.error("[v0] Failed to create Piped API instance")
      return NextResponse.json(
        { error: "Piped API unavailable", message: "Could not initialize Piped API" },
        { status: 503 },
      )
    }

    console.log("[v0] Calling pipedAPI.getTrending...")
    const result = await pipedAPI.getTrending(maxResults)

    if (!result || !result.videos || !Array.isArray(result.videos)) {
      console.error("[v0] Invalid result structure from Piped API:", result)
      return NextResponse.json(
        { error: "Invalid response from Piped API", message: "Unexpected data format" },
        { status: 502 },
      )
    }

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
    console.error("[v0] Server-side Piped trending API error:", {
      message: error?.message || "Unknown error",
      stack: error?.stack,
      name: error?.name,
      cause: error?.cause,
    })

    return NextResponse.json({
      songs: [],
      videos: [],
      source: "piped",
      error: "Piped API temporarily unavailable",
    })
  }
}
