import { NextResponse } from "next/server"
import { getHomeFeed } from "@/lib/innertube"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 300

export async function GET() {
  console.log("[v0] ===== HOME API ROUTE CALLED =====")
  console.log("[v0] Runtime:", runtime)
  console.log("[v0] Timestamp:", new Date().toISOString())

  try {
    console.log("[v0] Calling getHomeFeed()...")
    const homeFeed = await getHomeFeed()
    console.log("[v0] getHomeFeed() returned")

    if (homeFeed?.sections && homeFeed.sections.length > 0) {
      console.log("[v0] ===== SUCCESS =====")
      console.log("[v0] Sections:", homeFeed.sections.length)
      console.log("[v0] Titles:", homeFeed.sections.map((s) => s.title).join(", "))

      return NextResponse.json(homeFeed, {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      })
    }

    console.log("[v0] ===== NO SECTIONS =====")
    console.log("[v0] Returning empty sections")

    return NextResponse.json(
      { sections: [] },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      },
    )
  } catch (error: any) {
    console.error("[v0] ===== HOME API ERROR =====")
    console.error("[v0] Error message:", error.message)
    console.error("[v0] Error stack:", error.stack)

    return NextResponse.json(
      { sections: [], error: error.message },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      },
    )
  }
}
