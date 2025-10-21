import { type NextRequest, NextResponse } from "next/server"
import { searchYouTube } from "@/lib/youtube"

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
    console.log(`[v0] Searching with YouTube Data API for: ${query}`)

    const result = await searchYouTube(query, pageToken || undefined)

    console.log(`[v0] YouTube API returned ${result.videos.length} videos`)

    return NextResponse.json(
      {
        videos: result.videos,
        nextPageToken: result.nextPageToken,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    )
  } catch (error: any) {
    console.error("[v0] Search error:", error)

    if (error?.status === 403 && error?.data?.error?.errors?.[0]?.reason === "quotaExceeded") {
      return NextResponse.json(
        {
          error: "YouTube API quota exceeded. Please try again later.",
          videos: [],
          nextPageToken: null,
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "public, s-maxage=300",
          },
        },
      )
    }

    return NextResponse.json(
      {
        error: "Failed to search. Please try again.",
        videos: [],
        nextPageToken: null,
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
