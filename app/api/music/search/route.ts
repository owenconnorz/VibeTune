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
    const result = await searchYouTube(query, pageToken || undefined)

    return NextResponse.json(
      {
        videos: result.videos,
        nextPageToken: result.nextPageToken || null,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
        },
      },
    )
  } catch (error: any) {
    console.error("[v0] Search API error:", error)

    const isQuotaError = error?.message?.includes("quota") || error?.message?.includes("403")

    if (isQuotaError) {
      return NextResponse.json(
        {
          error: "YouTube API quota exceeded. Please try again later.",
          quotaExceeded: true,
          videos: [],
          nextPageToken: null,
        },
        { status: 200 },
      )
    }

    return NextResponse.json(
      {
        error: "Failed to search. Please try again.",
        videos: [],
        nextPageToken: null,
      },
      { status: 200 },
    )
  }
}
