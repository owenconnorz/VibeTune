import { NextResponse } from "next/server"
import { getHomeFeed } from "@/lib/youtube-api"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const revalidate = 3600 // Cache for 1 hour

function getMockHomeFeed() {
  return {
    sections: [
      {
        title: "Quick picks",
        items: [
          {
            id: "dQw4w9WgXcQ",
            title: "Never Gonna Give You Up",
            artist: "Rick Astley",
            thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
            duration: "3:33",
            channelTitle: "Rick Astley",
          },
          {
            id: "9bZkp7q19f0",
            title: "Gangnam Style",
            artist: "PSY",
            thumbnail: "https://i.ytimg.com/vi/9bZkp7q19f0/maxresdefault.jpg",
            duration: "4:13",
            channelTitle: "PSY",
          },
          {
            id: "kJQP7kiw5Fk",
            title: "Despacito",
            artist: "Luis Fonsi ft. Daddy Yankee",
            thumbnail: "https://i.ytimg.com/vi/kJQP7kiw5Fk/maxresdefault.jpg",
            duration: "4:42",
            channelTitle: "Luis Fonsi",
          },
        ],
      },
      {
        title: "Trending Now",
        items: [
          {
            id: "60ItHLz5WEA",
            title: "Faded",
            artist: "Alan Walker",
            thumbnail: "https://i.ytimg.com/vi/60ItHLz5WEA/maxresdefault.jpg",
            duration: "3:32",
            channelTitle: "Alan Walker",
          },
          {
            id: "RgKAFK5djSk",
            title: "Waka Waka",
            artist: "Shakira",
            thumbnail: "https://i.ytimg.com/vi/RgKAFK5djSk/maxresdefault.jpg",
            duration: "3:27",
            channelTitle: "Shakira",
          },
        ],
      },
      {
        title: "Top Hits",
        items: [
          {
            id: "OPf0YbXqDm0",
            title: "Uptown Funk",
            artist: "Mark Ronson ft. Bruno Mars",
            thumbnail: "https://i.ytimg.com/vi/OPf0YbXqDm0/maxresdefault.jpg",
            duration: "4:30",
            channelTitle: "Mark Ronson",
          },
          {
            id: "hT_nvWreIhg",
            title: "Counting Stars",
            artist: "OneRepublic",
            thumbnail: "https://i.ytimg.com/vi/hT_nvWreIhg/maxresdefault.jpg",
            duration: "4:17",
            channelTitle: "OneRepublic",
          },
        ],
      },
    ],
  }
}

export async function GET() {
  console.log("[v0] ===== HOME API ROUTE CALLED =====")
  console.log("[v0] Runtime:", runtime)
  console.log("[v0] Timestamp:", new Date().toISOString())

  try {
    console.log("[v0] Fetching home feed from YouTube Data API...")

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("API route timeout after 20s")), 20000),
    )

    const homeFeed = (await Promise.race([getHomeFeed(), timeoutPromise])) as any

    console.log("[v0] Home feed result:", homeFeed?.sections?.length || 0, "sections")

    if (homeFeed?.sections && homeFeed.sections.length > 0) {
      console.log("[v0] Successfully fetched real data from YouTube Data API")
      return NextResponse.json(homeFeed, {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
        },
      })
    }

    console.log("[v0] YouTube Data API returned no results (likely quota exceeded), using mock data")
    return NextResponse.json(getMockHomeFeed(), {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    })
  } catch (error: any) {
    console.error("[v0] ===== HOME FEED ERROR =====")
    console.error("[v0] Error type:", typeof error)
    console.error("[v0] Error:", error)
    if (error instanceof Error) {
      console.error("[v0] Error name:", error.name)
      console.error("[v0] Error message:", error.message)
      console.error("[v0] Error stack:", error.stack)
    }
    console.log("[v0] Falling back to mock data")

    return NextResponse.json(getMockHomeFeed(), {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    })
  }
}
