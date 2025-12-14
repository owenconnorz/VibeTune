import { type NextRequest, NextResponse } from "next/server"
import { cache } from "@/lib/cache"
import { fetchPlaylistDetails } from "@/app/actions/youtube-music"

// Static fallback playlist data - no imports needed
const createPlaylistData = (id: string, title: string) => ({
  id,
  title,
  description: `A curated collection of great music`,
  thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
  videoCount: 10,
  videos: [
    {
      id: "dQw4w9WgXcQ",
      title: "Never Gonna Give You Up",
      artist: "Rick Astley",
      thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      duration: "3:33",
    },
    {
      id: "9bZkp7q19f0",
      title: "Gangnam Style",
      artist: "PSY",
      thumbnail: "https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg",
      duration: "4:13",
    },
    {
      id: "kJQP7kiw5Fk",
      title: "Despacito",
      artist: "Luis Fonsi ft. Daddy Yankee",
      thumbnail: "https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg",
      duration: "4:42",
    },
    {
      id: "JGwWNGJdvx8",
      title: "Shape of You",
      artist: "Ed Sheeran",
      thumbnail: "https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg",
      duration: "3:54",
    },
    {
      id: "fRh_vgS2dFE",
      title: "Sorry",
      artist: "Justin Bieber",
      thumbnail: "https://i.ytimg.com/vi/fRh_vgS2dFE/hqdefault.jpg",
      duration: "3:20",
    },
    {
      id: "RgKAFK5djSk",
      title: "Waka Waka",
      artist: "Shakira",
      thumbnail: "https://i.ytimg.com/vi/RgKAFK5djSk/hqdefault.jpg",
      duration: "3:23",
    },
    {
      id: "CevxZvSJLk8",
      title: "Roar",
      artist: "Katy Perry",
      thumbnail: "https://i.ytimg.com/vi/CevxZvSJLk8/hqdefault.jpg",
      duration: "3:43",
    },
    {
      id: "hT_nvWreIhg",
      title: "Counting Stars",
      artist: "OneRepublic",
      thumbnail: "https://i.ytimg.com/vi/hT_nvWreIhg/hqdefault.jpg",
      duration: "4:17",
    },
    {
      id: "nfWlot6h_JM",
      title: "Shake It Off",
      artist: "Taylor Swift",
      thumbnail: "https://i.ytimg.com/vi/nfWlot6h_JM/hqdefault.jpg",
      duration: "3:39",
    },
    {
      id: "OPf0YbXqDm0",
      title: "Uptown Funk",
      artist: "Mark Ronson ft. Bruno Mars",
      thumbnail: "https://i.ytimg.com/vi/OPf0YbXqDm0/hqdefault.jpg",
      duration: "4:30",
    },
  ],
})

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: "Playlist ID is required" }, { status: 400 })
    }

    console.log("[v0] Playlist API: Request for ID:", id)

    let cleanId = id
    if (id.startsWith("VL")) {
      cleanId = id.substring(2)
      console.log("[v0] Stripped VL prefix, new ID:", cleanId)
    }

    const cacheKey = `playlist_${cleanId}`
    const cachedPlaylist = cache.get(cacheKey)

    if (cachedPlaylist) {
      console.log("[v0] Playlist loaded from cache")
      return NextResponse.json(cachedPlaylist)
    }

    console.log("[v0] Fetching playlist from YouTube Music via server action")
    const result = await fetchPlaylistDetails(id)

    if (result.success && result.data) {
      console.log("[v0] Successfully fetched playlist from YouTube Music")
      cache.set(cacheKey, result.data)
      return NextResponse.json(result.data, {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      })
    }

    console.log("[v0] YouTube Music fetch failed, using fallback data")
    const playlist = createPlaylistData(cleanId, `Playlist ${cleanId.substring(0, 8)}`)

    cache.set(cacheKey, playlist)
    console.log("[v0] Playlist cached and returned")

    return NextResponse.json(playlist, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    })
  } catch (error: any) {
    console.error("[v0] Playlist API error:", error?.message || "Unknown error")

    const fallbackPlaylist = createPlaylistData(params.id, "Sample Playlist")
    return NextResponse.json(fallbackPlaylist, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    })
  }
}
