import { NextResponse } from "next/server"
import { getHomeFeed } from "@/lib/innertube"

export async function GET() {
  try {
    const homeFeed = await getHomeFeed()
    return NextResponse.json(homeFeed)
  } catch (error) {
    console.error("[v0] Error in home feed API:", error)
    return NextResponse.json({ sections: [] }, { status: 500 })
  }
}
