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

    if (!pipedAPI) {
      console.error("[v0] Failed to create Piped API instance")
      return NextResponse.json({
        songs: [],
        videos: [],
        source: "piped",
        query,
        error: "Piped API unavailable",
      })
    }

    console.log("[v0] Calling pipedAPI.search...")
    const result = await pipedAPI.search(query, maxResults)

    if (!result || !result.videos || !Array.isArray(result.videos)) {
      console.error("[v0] Invalid result structure from Piped search API:", result)
      return NextResponse.json({
        songs: [],
        videos: [],
        source: "piped",
        query,
        error: "Invalid response from Piped API",
      })
    }

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
    console.error("[v0] Server-side Piped search API error:", {
      message: error?.message || "Unknown error",
      stack: error?.stack,
      name: error?.name,
      cause: error?.cause,
    })

    const query = new URL(request.url).searchParams.get("q") || ""

    return NextResponse.json({
      songs: [],
      videos: [],
      source: "piped",
      query,
      error: "Piped API temporarily unavailable",
    })
  }
}
