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
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ videos: [], nextPageToken: null }, { status: 200 })
  }
}
