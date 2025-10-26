import { type NextRequest, NextResponse } from "next/server"
import { searchMusic, searchYouTube } from "@/lib/innertube"

export const dynamic = "force-dynamic"

interface CachedResult {
  videos: any[]
  nextPageToken: string | null
  timestamp: number
}

const serverCache = new Map<string, CachedResult>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function getCacheKey(query: string, pageToken?: string, searchType?: string): string {
  return `${searchType || "music"}:${query.toLowerCase()}:${pageToken || "initial"}`
}

function getCachedResult(cacheKey: string): CachedResult | null {
  const cached = serverCache.get(cacheKey)

  if (!cached) return null

  // Check if cache is expired
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    serverCache.delete(cacheKey)
    return null
  }

  return cached
}

function setCachedResult(cacheKey: string, videos: any[], nextPageToken: string | null) {
  serverCache.set(cacheKey, {
    videos,
    nextPageToken,
    timestamp: Date.now(),
  })

  // Limit cache size
  if (serverCache.size > 100) {
    const firstKey = serverCache.keys().next().value
    serverCache.delete(firstKey)
  }
}

const getMockSearchResults = (query: string) => {
  const lowerQuery = query.toLowerCase()

  // Extract potential artist name from query (first few words before common keywords)
  const commonKeywords = ["official", "music", "video", "audio", "live", "lyrics", "cover", "remix", "acoustic"]
  const words = query.split(" ").filter((word) => !commonKeywords.includes(word.toLowerCase()))

  // Capitalize artist name properly
  const artistName =
    words
      .slice(0, Math.min(3, words.length))
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ") || "Various Artists"

  // Real Red Hot Chili Peppers video IDs that will actually play
  const realVideoIds = [
    { id: "YlUKcNNmywk", title: "Californication", duration: "5:21" },
    { id: "Mr_uHJPUlO8", title: "Under the Bridge", duration: "4:24" },
    { id: "8DyziWtkfBw", title: "Can't Stop", duration: "4:29" },
    { id: "lwlogyj7nFE", title: "Scar Tissue", duration: "3:37" },
    { id: "BfOdWSiyWoc", title: "Otherside", duration: "4:15" },
  ]

  // Generate realistic song variations using real video IDs
  const mockResults = realVideoIds.slice(0, 3).map((video, index) => ({
    id: video.id,
    title: index === 0 ? video.title : `${video.title} (Official Music Video)`,
    artist: artistName,
    thumbnail: `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`,
    duration: video.duration,
  }))

  return mockResults
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("q")
  const pageToken = searchParams.get("pageToken")
  const searchType = searchParams.get("type") || "music" // "music" or "youtube"

  if (!query) {
    return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
  }

  try {
    const cacheKey = getCacheKey(query, pageToken || undefined, searchType)
    const cached = getCachedResult(cacheKey)

    if (cached) {
      console.log(
        `[v0] Returning cached ${searchType} search results for: ${query}${pageToken ? ` (continuation)` : ""}`,
      )
      console.log(`[v0] Cached results count: ${cached.videos.length}`)
      const artistCount = cached.videos.filter((v: any) => v.type === "artist").length
      console.log(`[v0] Cached artist results: ${artistCount}`)
      if (artistCount > 0) {
        console.log(
          `[v0] First artist:`,
          JSON.stringify(
            cached.videos.find((v: any) => v.type === "artist"),
            null,
            2,
          ),
        )
      }
      return NextResponse.json(
        {
          videos: cached.videos,
          nextPageToken: cached.nextPageToken,
          cached: true,
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
            "X-Cache-Status": "HIT",
          },
        },
      )
    }

    console.log(
      `[v0] Searching with ${searchType === "youtube" ? "YouTube" : "YouTube Music"} API for: ${query}${pageToken ? ` (continuation: ${pageToken})` : ""}`,
    )

    const result =
      searchType === "youtube"
        ? await searchYouTube(query, pageToken || undefined)
        : await searchMusic(query, pageToken || undefined)

    console.log(`[v0] API returned ${result.videos.length} videos`)

    const artistCount = result.videos.filter((v: any) => v.type === "artist").length
    const songCount = result.videos.filter(
      (v: any) => !v.browseId && v.type !== "youtube_video" && v.type !== "artist",
    ).length
    const videoCount = result.videos.filter((v: any) => v.type === "youtube_video").length

    console.log(`[v0] Search results breakdown:`)
    console.log(`[v0]   - Artists: ${artistCount}`)
    console.log(`[v0]   - Songs: ${songCount}`)
    console.log(`[v0]   - Videos: ${videoCount}`)
    console.log(`[v0]   - Other: ${result.videos.length - artistCount - songCount - videoCount}`)

    if (artistCount > 0) {
      const firstArtist = result.videos.find((v: any) => v.type === "artist")
      console.log(`[v0] First artist result:`, JSON.stringify(firstArtist, null, 2))
    } else {
      console.log(`[v0] ⚠️ NO ARTIST RESULTS FOUND`)
      console.log(`[v0] First 3 results:`, JSON.stringify(result.videos.slice(0, 3), null, 2))
    }

    setCachedResult(cacheKey, result.videos, result.continuation)

    return NextResponse.json(
      {
        videos: result.videos,
        nextPageToken: result.continuation,
        cached: false,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          "X-Cache-Status": "MISS",
        },
      },
    )
  } catch (error: any) {
    console.error("[v0] Search error details:", {
      message: error.message,
      stack: error.stack,
      query,
      pageToken,
      searchType,
    })

    return NextResponse.json(
      {
        error: "Failed to search music",
        message: error.message,
        videos: [],
        nextPageToken: null,
      },
      {
        status: 200,
      },
    )
  }
}
