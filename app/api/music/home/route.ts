import { NextResponse } from "next/server"
import { getHomeFeed } from "@/lib/innertube"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("[v0] Fetching home feed...")
    const homeFeed = await getHomeFeed()
    console.log("[v0] Home feed fetched successfully, sections:", homeFeed.sections.length)
    return NextResponse.json(homeFeed)
  } catch (error) {
    console.error("[v0] Error in home feed API:", error)
    return NextResponse.json(
      {
        sections: [],
        error: error instanceof Error ? error.message : "Failed to fetch home feed",
      },
      { status: 200 }, // Return 200 to avoid Next.js error page
    )
  }
}
