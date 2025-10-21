import { type NextRequest, NextResponse } from "next/server"
import { searchMusic } from "@/lib/invidious"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("q")

  if (!query) {
    return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
  }

  try {
    console.log(`[v0] Searching with Invidious API for: ${query}`)

    const result = await searchMusic(query)

    console.log(`[v0] Invidious API returned ${result.length} videos`)

    return NextResponse.json(
      {
        videos: result,
        nextPageToken: null,
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
