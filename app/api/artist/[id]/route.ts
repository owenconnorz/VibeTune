import { type NextRequest, NextResponse } from "next/server"

// Mock artist data
const mockArtists: Record<string, any> = {
  "red-hot-chili-peppers": {
    id: "red-hot-chili-peppers",
    name: "Red Hot Chili Peppers",
    thumbnail: "https://i.ytimg.com/vi/YlUKcNNmywk/maxresdefault.jpg",
    banner: "https://i.ytimg.com/vi/YlUKcNNmywk/maxresdefault.jpg",
    description: "Official Red Hot Chili Peppers channel",
    subscribers: "10M subscribers",
    topSongs: [
      {
        id: "YlUKcNNmywk",
        title: "Californication",
        artist: "Red Hot Chili Peppers",
        thumbnail: "https://i.ytimg.com/vi/YlUKcNNmywk/mqdefault.jpg",
        duration: "5:30",
        views: "1.2B views",
      },
      {
        id: "Mr_uHJPUlO8",
        title: "Under the Bridge",
        artist: "Red Hot Chili Peppers",
        thumbnail: "https://i.ytimg.com/vi/Mr_uHJPUlO8/mqdefault.jpg",
        duration: "4:25",
        views: "800M views",
      },
      {
        id: "8DyziWtkfBw",
        title: "Can't Stop",
        artist: "Red Hot Chili Peppers",
        thumbnail: "https://i.ytimg.com/vi/8DyziWtkfBw/mqdefault.jpg",
        duration: "4:29",
        views: "600M views",
      },
      {
        id: "BfOdWSiyWoc",
        title: "Otherside",
        artist: "Red Hot Chili Peppers",
        thumbnail: "https://i.ytimg.com/vi/BfOdWSiyWoc/mqdefault.jpg",
        duration: "4:15",
        views: "500M views",
      },
      {
        id: "lwlogyj7nFE",
        title: "Scar Tissue",
        artist: "Red Hot Chili Peppers",
        thumbnail: "https://i.ytimg.com/vi/lwlogyj7nFE/mqdefault.jpg",
        duration: "3:37",
        views: "450M views",
      },
      {
        id: "rn_YodiJO6k",
        title: "Snow (Hey Oh)",
        artist: "Red Hot Chili Peppers",
        thumbnail: "https://i.ytimg.com/vi/rn_YodiJO6k/mqdefault.jpg",
        duration: "5:34",
        views: "400M views",
      },
    ],
    videos: [
      {
        id: "YlUKcNNmywk",
        title: "Californication",
        thumbnail: "https://i.ytimg.com/vi/YlUKcNNmywk/mqdefault.jpg",
        views: "1.2B views",
      },
      {
        id: "BfOdWSiyWoc",
        title: "Otherside",
        thumbnail: "https://i.ytimg.com/vi/BfOdWSiyWoc/mqdefault.jpg",
        views: "500M views",
      },
    ],
    albums: [
      {
        id: "album-1",
        title: "Return of the Dream Canteen",
        year: "2022",
        thumbnail: "https://i.ytimg.com/vi/YlUKcNNmywk/mqdefault.jpg",
      },
      {
        id: "album-2",
        title: "Unlimited Love",
        year: "2022",
        thumbnail: "https://i.ytimg.com/vi/Mr_uHJPUlO8/mqdefault.jpg",
      },
      {
        id: "album-3",
        title: "The Getaway",
        year: "2016",
        thumbnail: "https://i.ytimg.com/vi/8DyziWtkfBw/mqdefault.jpg",
      },
    ],
    singles: [
      {
        id: "single-1",
        title: "Tippa My Tongue",
        year: "2022",
        thumbnail: "https://i.ytimg.com/vi/YlUKcNNmywk/mqdefault.jpg",
      },
      {
        id: "single-2",
        title: "Eddie",
        year: "2022",
        thumbnail: "https://i.ytimg.com/vi/Mr_uHJPUlO8/mqdefault.jpg",
      },
    ],
  },
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const artistId = params.id

    // Return mock data for now
    const artist = mockArtists[artistId]

    if (!artist) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 })
    }

    return NextResponse.json({ artist })
  } catch (error) {
    console.error("[v0] Error fetching artist:", error)
    return NextResponse.json({ error: "Failed to fetch artist" }, { status: 500 })
  }
}
