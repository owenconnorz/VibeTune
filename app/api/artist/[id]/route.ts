import { type NextRequest, NextResponse } from "next/server"
import { getArtistData } from "@/lib/innertube"

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

    console.log("[v0] Fetching artist data for:", artistId)

    // Convert URL-friendly ID to browse ID format
    // For now, we'll need to search for the artist first to get their browse ID
    // This is a simplified approach - in production, you'd store the browse ID from search results

    // Try to fetch artist data using the ID as a browse ID
    // YouTube Music artist browse IDs typically start with "UC" or "MPLA"
    const browseId = artistId

    // If the ID is URL-friendly (like "red-hot-chili-peppers"), we need to convert it
    // For now, return a helpful error message
    if (!artistId.startsWith("UC") && !artistId.startsWith("MPLA")) {
      return NextResponse.json(
        {
          error: "Invalid artist ID format. Please navigate to artist from search results.",
          message: "Artist pages must be accessed through search results to get the correct browse ID.",
        },
        { status: 400 },
      )
    }

    const artistData = await getArtistData(browseId)

    return NextResponse.json({ artist: artistData })
  } catch (error) {
    console.error("[v0] Error fetching artist:", error)
    return NextResponse.json(
      { error: "Failed to fetch artist data", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
