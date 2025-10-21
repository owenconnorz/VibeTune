import { type NextRequest, NextResponse } from "next/server"
import { searchMusic } from "@/lib/youtube-api"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("q")
  const continuation = searchParams.get("continuation")

  if (!query) {
    return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
  }

  try {
    console.log(`[v0] Searching with YouTube Data API for: ${query}`)

    const result = await searchMusic(query)

    console.log(`[v0] YouTube Data API returned ${result.videos.length} videos`)

    return NextResponse.json(
      {
        videos: result.videos,
        continuation: result.continuation,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    )
  } catch (error: any) {
    console.error("[v0] Search error:", error)

    return NextResponse.json(
      {
        error: "Failed to search. Please try again.",
        videos: [],
        continuation: null,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300",
        },
      },
    )
  }
}
