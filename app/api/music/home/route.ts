import { NextResponse } from "next/server"
import { fetchMusicHomeFeed } from "@/app/actions/youtube-music"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("[v0] Home API: Fetching YouTube Music data via server action")

    // Call the server action to fetch YouTube Music data
    const result = await fetchMusicHomeFeed()

    if (result.success && result.data.sections.length > 0) {
      console.log("[v0] Home API: Successfully fetched YouTube Music data")
      return NextResponse.json(result.data, {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      })
    }

    console.log("[v0] Home API: Using fallback data")
    const fallbackData = {
      sections: [
        {
          title: "Quick Start",
          items: [
            {
              id: "dQw4w9WgXcQ",
              title: "Never Gonna Give You Up",
              artist: "Rick Astley",
              thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
              duration: "3:33",
              type: "song",
              aspectRatio: "square",
            },
            {
              id: "9bZkp7q19f0",
              title: "Gangnam Style",
              artist: "PSY",
              thumbnail: "https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg",
              duration: "4:13",
              type: "song",
              aspectRatio: "square",
            },
          ],
          type: "carousel" as const,
          continuation: null,
        },
      ],
    }

    return NextResponse.json(fallbackData, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    })
  } catch (error: any) {
    console.error("[v0] Home API error:", error?.message || "Unknown error")

    const fallbackData = {
      sections: [
        {
          title: "Quick Start",
          items: [
            {
              id: "dQw4w9WgXcQ",
              title: "Never Gonna Give You Up",
              artist: "Rick Astley",
              thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
              duration: "3:33",
              type: "song",
              aspectRatio: "square",
            },
          ],
          type: "carousel" as const,
          continuation: null,
        },
      ],
    }

    return NextResponse.json(fallbackData, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    })
  }
}
