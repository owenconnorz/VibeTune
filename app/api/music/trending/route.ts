import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("[v0] Trending music API called")

    // Use the YouTube Music API for trending
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/youtube-music/trending?limit=25`)
    
    if (!response.ok) {
      throw new Error(`YouTube Music API error: ${response.status}`)
    }

    const data = await response.json()
    
    return NextResponse.json({
      songs: data.tracks || [],
      source: "youtube-music",
      count: data.tracks?.length || 0,
    })
  } catch (error) {
    console.error("[v0] Trending music API error:", error)
    
    // Fallback trending songs
    const fallbackSongs = [
      {
        id: "dQw4w9WgXcQ",
        title: "Never Gonna Give You Up",
        artist: "Rick Astley",
        thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
        duration: "3:33",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
      {
        id: "9bZkp7q19f0",
        title: "Gangnam Style",
        artist: "PSY",
        thumbnail: "https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg",
        duration: "4:13",
        url: "https://www.youtube.com/watch?v=9bZkp7q19f0",
      },
    ]

    return NextResponse.json({
      songs: fallbackSongs,
      source: "fallback",
      count: fallbackSongs.length,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}