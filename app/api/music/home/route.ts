import { NextResponse } from "next/server"
import type { HomeFeedSection } from "@/lib/innertube"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function getMockHomeFeed(): { sections: HomeFeedSection[] } {
  const mockSections: HomeFeedSection[] = [
    {
      title: "Quick picks",
      items: [
        {
          id: "dQw4w9WgXcQ",
          title: "Never Gonna Give You Up",
          artist: "Rick Astley",
          thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
          duration: "3:33",
          channelTitle: "Rick Astley",
        },
        {
          id: "9bZkp7q19f0",
          title: "Gangnam Style",
          artist: "PSY",
          thumbnail: "https://i.ytimg.com/vi/9bZkp7q19f0/mqdefault.jpg",
          duration: "4:13",
          channelTitle: "PSY",
        },
        {
          id: "kJQP7kiw5Fk",
          title: "Despacito",
          artist: "Luis Fonsi ft. Daddy Yankee",
          thumbnail: "https://i.ytimg.com/vi/kJQP7kiw5Fk/mqdefault.jpg",
          duration: "4:42",
          channelTitle: "Luis Fonsi",
        },
        {
          id: "fJ9rUzIMcZQ",
          title: "Bohemian Rhapsody",
          artist: "Queen",
          thumbnail: "https://i.ytimg.com/vi/fJ9rUzIMcZQ/mqdefault.jpg",
          duration: "5:55",
          channelTitle: "Queen",
        },
        {
          id: "JGwWNGJdvx8",
          title: "Shape of You",
          artist: "Ed Sheeran",
          thumbnail: "https://i.ytimg.com/vi/JGwWNGJdvx8/mqdefault.jpg",
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
          thumbnail: "https://i.ytimg.com/vi/60ItHLz5WEA/mqdefault.jpg",
          duration: "3:32",
          channelTitle: "Alan Walker",
        },
        {
          id: "RgKAFK5djSk",
          title: "Waka Waka",
          artist: "Shakira",
          thumbnail: "https://i.ytimg.com/vi/RgKAFK5djSk/mqdefault.jpg",
          duration: "3:27",
          channelTitle: "Shakira",
        },
        {
          id: "CevxZvSJLk8",
          title: "Roar",
          artist: "Katy Perry",
          thumbnail: "https://i.ytimg.com/vi/CevxZvSJLk8/mqdefault.jpg",
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
          thumbnail: "https://i.ytimg.com/vi/OPf0YbXqDm0/mqdefault.jpg",
          duration: "4:30",
          channelTitle: "Mark Ronson",
        },
        {
          id: "hT_nvWreIhg",
          title: "Counting Stars",
          artist: "OneRepublic",
          thumbnail: "https://i.ytimg.com/vi/hT_nvWreIhg/mqdefault.jpg",
          duration: "4:17",
          channelTitle: "OneRepublic",
        },
        {
          id: "ru0K8uYEZWw",
          title: "CAN'T STOP THE FEELING!",
          artist: "Justin Timberlake",
          thumbnail: "https://i.ytimg.com/vi/ru0K8uYEZWw/mqdefault.jpg",
          duration: "3:56",
          channelTitle: "Justin Timberlake",
        },
      ],
    },
  ]

  return { sections: mockSections }
}

export async function GET() {
  try {
    console.log("[v0] Home feed API called")

    const mockFeed = getMockHomeFeed()
    console.log("[v0] Returning mock home feed with", mockFeed.sections.length, "sections")

    return NextResponse.json(mockFeed)
  } catch (error) {
    console.error("[v0] Error in home feed API:", error)

    // Return mock data even on error
    return NextResponse.json(getMockHomeFeed())
  }
}
