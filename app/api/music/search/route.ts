import { type NextRequest, NextResponse } from "next/server"
import { searchMusic, convertToAppFormat } from "@/lib/invidious"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("q")
  const pageToken = searchParams.get("pageToken")

  if (!query) {
    return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
  }

  try {
    console.log(`[v0] Searching with Invidious API for: ${query}`)

    const page = pageToken ? Number.parseInt(pageToken) : 1
    const result = await searchMusic(query, page)

    const videos = result.videos.map(convertToAppFormat)

    console.log(`[v0] Invidious returned ${videos.length} videos`)

    return NextResponse.json(
      {
        videos,
        nextPageToken: result.hasMore ? String(page + 1) : null,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    )
  } catch (error: any) {
    console.error("[v0] Search error:", error)

    return NextResponse.json(
      {
        error: "Failed to search. Please try again.",
        videos: [],
        nextPageToken: null,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      },
    )
  }
}
