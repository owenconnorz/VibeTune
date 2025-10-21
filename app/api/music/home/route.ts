import { NextResponse } from "next/server"
import { getTrending, getPopularMusic, getMusicByGenre } from "@/lib/piped"

export const runtime = "nodejs"
export const revalidate = 60

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
  try {
    console.log("[v0] Fetching home feed from Piped...")

    const [trending, popular, genreMusic] = await Promise.all([
      getTrending().catch(() => []),
      getPopularMusic().catch(() => []),
      getMusicByGenre("top hits").catch(() => []),
    ])

    const trendingItems = trending.slice(0, 5)
    const popularItems = popular.slice(0, 5)
    const quickPicks = genreMusic.slice(0, 3)

    if (trendingItems.length > 0 || popularItems.length > 0) {
      console.log("[v0] Successfully fetched real home feed data")
      return NextResponse.json(
        {
          sections: [
            {
              title: "Quick picks",
              items: quickPicks.length > 0 ? quickPicks : getMockHomeFeed().sections[0].items,
            },
            {
              title: "Trending Now",
              items: trendingItems.length > 0 ? trendingItems : getMockHomeFeed().sections[1].items,
            },
            {
              title: "Top Hits",
              items: popularItems.length > 0 ? popularItems : getMockHomeFeed().sections[2].items,
            },
          ],
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
          },
        },
      )
    }

    console.log("[v0] Falling back to mock data")
    return NextResponse.json(getMockHomeFeed(), {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    })
  } catch (error) {
    console.error("[v0] Home feed error:", error)
    return NextResponse.json(getMockHomeFeed(), {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    })
  }
}
