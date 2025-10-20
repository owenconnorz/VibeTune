import { type NextRequest, NextResponse } from "next/server"
import { searchMusic } from "@/lib/innertube"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("q")
  const continuation = searchParams.get("continuation")

  if (!query) {
    return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
  }

  try {
    const results = await searchMusic(query, continuation || undefined)
    return NextResponse.json(results)
  } catch (error) {
    console.error("[v0] Search error:", error)
    return NextResponse.json({ error: "Failed to search" }, { status: 500 })
  }
}
