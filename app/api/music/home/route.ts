import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const revalidate = 300

const FALLBACK_DATA = {
  sections: [
    {
      title: "Quick picks",
      items: [],
      type: "list",
      continuation: null,
      query: "trending music 2024",
    },
    {
      title: "Popular Music",
      items: [],
      type: "carousel",
      continuation: null,
      query: "popular music 2024",
    },
    {
      title: "Feel Good",
      items: [],
      type: "carousel",
      continuation: null,
      query: "feel good music",
    },
  ],
}

export async function GET() {
  try {
    console.log("[v0] Home API: Starting request")

    // TODO: Re-enable getHomeFeed() once the crash is fixed
    console.log("[v0] Home API: Returning fallback data (debugging mode)")

    return NextResponse.json(FALLBACK_DATA, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    })
  } catch (error: any) {
    console.error("[v0] Home API error:", error.message)
    console.error("[v0] Home API stack:", error.stack)

    return NextResponse.json(FALLBACK_DATA, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    })
  }
}
