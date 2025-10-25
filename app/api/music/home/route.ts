import { NextResponse } from "next/server"
import { getHomeFeed } from "@/lib/innertube"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 300
export const maxDuration = 20

export async function GET() {
  try {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Home feed request timeout")), 18000)
    })

    const homeFeed = (await Promise.race([getHomeFeed(), timeoutPromise])) as any

    if (homeFeed?.sections && homeFeed.sections.length > 0) {
      return NextResponse.json(homeFeed, {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      })
    }

    return NextResponse.json(
      {
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
        ],
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      },
    )
  } catch (error: any) {
    console.error("[v0] Home API error:", error.message)

    return NextResponse.json(
      {
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
        ],
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      },
    )
  }
}
