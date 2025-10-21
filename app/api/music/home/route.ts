import { NextResponse } from "next/server"
import type { HomeFeedSection } from "@/lib/innertube"

export const runtime = "nodejs"
export const revalidate = 1800 // Revalidate every 30 minutes

async function fetchPopularMusic(): Promise<{ sections: HomeFeedSection[] }> {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    console.error("[v0] YouTube API key not found")
    return getMockHomeFeed()
  }

  try {
    const categories = [
      { title: "Quick picks", query: "official music video 2024" },
      { title: "Trending Now", query: "billboard hot 100 official audio" },
      { title: "Top Hits", query: "top songs 2024 official video" },
      { title: "New Releases", query: "new music 2024 official audio" },
      { title: "Popular Artists", query: "popular artists official music video" },
    ]

    const sections: HomeFeedSection[] = []

    for (const category of categories) {
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(category.query)}&type=video&videoCategoryId=10&maxResults=10&order=viewCount&relevanceLanguage=en&key=${apiKey}`

      const searchResponse = await fetch(searchUrl)
      if (!searchResponse.ok) {
        console.error("[v0] YouTube API search failed for", category.title)
        continue
      }

      const searchData = await searchResponse.json()
      const videoIds = searchData.items?.map((item: any) => item.id.videoId).join(",") || ""

      if (!videoIds) continue

      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoIds}&key=${apiKey}`
      const detailsResponse = await fetch(detailsUrl)
      const detailsData = await detailsResponse.json()

      const items =
        detailsData.items
          ?.filter((item: any) => {
            const duration = item.contentDetails.duration
            const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
            if (!match) return false

            const hours = match[1] ? Number.parseInt(match[1].replace("H", "")) : 0
            const minutes = match[2] ? Number.parseInt(match[2].replace("M", "")) : 0

            if (hours > 0 || minutes > 10) return false

            const title = item.snippet.title.toLowerCase()
            const hasMusic =
              title.includes("official") ||
              title.includes("audio") ||
              title.includes("music video") ||
              title.includes("lyric") ||
              title.includes("mv")

            return hasMusic
          })
          .map((item: any) => ({
            id: item.id,
            title: item.snippet.title,
            artist: item.snippet.channelTitle,
            thumbnail:
              item.snippet.thumbnails.maxres?.url ||
              item.snippet.thumbnails.standard?.url ||
              item.snippet.thumbnails.high?.url ||
              item.snippet.thumbnails.medium?.url ||
              item.snippet.thumbnails.default?.url,
            duration: formatDuration(item.contentDetails.duration),
            channelTitle: item.snippet.channelTitle,
          })) || []

      if (items.length > 0) {
        sections.push({
          title: category.title,
          items,
        })
      }
    }

    console.log("[v0] Fetched", sections.length, "sections from YouTube API")
    return { sections: sections.length > 0 ? sections : getMockHomeFeed().sections }
  } catch (error) {
    console.error("[v0] Error fetching popular music:", error)
    return getMockHomeFeed()
  }
}

function formatDuration(duration: string): string {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
  if (!match) return "0:00"

  const hours = (match[1] || "").replace("H", "")
  const minutes = (match[2] || "0M").replace("M", "")
  const seconds = (match[3] || "0S").replace("S", "")

  if (hours) {
    return `${hours}:${minutes.padStart(2, "0")}:${seconds.padStart(2, "0")}`
  }
  return `${minutes}:${seconds.padStart(2, "0")}`
}

function getMockHomeFeed(): { sections: HomeFeedSection[] } {
  const mockSections: HomeFeedSection[] = [
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
        {
          id: "fJ9rUzIMcZQ",
          title: "Bohemian Rhapsody",
          artist: "Queen",
          thumbnail: "https://i.ytimg.com/vi/fJ9rUzIMcZQ/maxresdefault.jpg",
          duration: "5:55",
          channelTitle: "Queen",
        },
        {
          id: "JGwWNGJdvx8",
          title: "Shape of You",
          artist: "Ed Sheeran",
          thumbnail: "https://i.ytimg.com/vi/JGwWNGJdvx8/maxresdefault.jpg",
          duration: "3:54",
          channelTitle: "Ed Sheeran",
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
        {
          id: "CevxZvSJLk8",
          title: "Roar",
          artist: "Katy Perry",
          thumbnail: "https://i.ytimg.com/vi/CevxZvSJLk8/maxresdefault.jpg",
          duration: "3:43",
          channelTitle: "Katy Perry",
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
        {
          id: "ru0K8uYEZWw",
          title: "CAN'T STOP THE FEELING!",
          artist: "Justin Timberlake",
          thumbnail: "https://i.ytimg.com/vi/ru0K8uYEZWw/maxresdefault.jpg",
          duration: "3:56",
          channelTitle: "Justin Timberlake",
        },
      ],
    },
    {
      title: "New Releases",
      items: [
        {
          id: "YQHsXMglC9A",
          title: "Hello",
          artist: "Adele",
          thumbnail: "https://i.ytimg.com/vi/YQHsXMglC9A/maxresdefault.jpg",
          duration: "6:07",
          channelTitle: "Adele",
        },
        {
          id: "lp-EO5I60KA",
          title: "Blinding Lights",
          artist: "The Weeknd",
          thumbnail: "https://i.ytimg.com/vi/lp-EO5I60KA/maxresdefault.jpg",
          duration: "4:20",
          channelTitle: "The Weeknd",
        },
        {
          id: "nfWlot6h_JM",
          title: "Shake It Off",
          artist: "Taylor Swift",
          thumbnail: "https://i.ytimg.com/vi/nfWlot6h_JM/maxresdefault.jpg",
          duration: "3:39",
          channelTitle: "Taylor Swift",
        },
      ],
    },
    {
      title: "Popular Artists",
      items: [
        {
          id: "2Vv-BfVoq4g",
          title: "Perfect",
          artist: "Ed Sheeran",
          thumbnail: "https://i.ytimg.com/vi/2Vv-BfVoq4g/maxresdefault.jpg",
          duration: "4:23",
          channelTitle: "Ed Sheeran",
        },
        {
          id: "SlPhMPnQ58k",
          title: "Senorita",
          artist: "Shawn Mendes & Camila Cabello",
          thumbnail: "https://i.ytimg.com/vi/SlPhMPnQ58k/maxresdefault.jpg",
          duration: "3:11",
          channelTitle: "Shawn Mendes",
        },
        {
          id: "pRfmrE0ToTo",
          title: "7 Rings",
          artist: "Ariana Grande",
          thumbnail: "https://i.ytimg.com/vi/pRfmrE0ToTo/maxresdefault.jpg",
          duration: "2:58",
          channelTitle: "Ariana Grande",
        },
      ],
    },
  ]

  return { sections: mockSections }
}

export async function GET() {
  try {
    console.log("[v0] Home feed API called")
    const feed = await fetchPopularMusic()
    console.log("[v0] Returning home feed with", feed.sections.length, "sections")

    return NextResponse.json(feed, {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
      },
    })
  } catch (error) {
    console.error("[v0] Error in home feed API:", error)
    return NextResponse.json(getMockHomeFeed())
  }
}
