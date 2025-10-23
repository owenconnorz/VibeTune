import { type NextRequest, NextResponse } from "next/server"
import { searchMusic } from "@/lib/innertube"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

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
    thumbnail: `https://i.ytimg.com/vi/${video.id}/maxresdefault.jpg`,
    duration: video.duration,
  }))

  return mockResults
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("q")
  const pageToken = searchParams.get("pageToken")

  if (!query) {
    return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
  }

  try {
    console.log(`[v0] Searching with InnerTube API for: ${query}${pageToken ? ` (continuation: ${pageToken})` : ""}`)

    const result = await searchMusic(query, pageToken || undefined)

    console.log(`[v0] InnerTube API returned ${result.videos.length} videos`)

    return NextResponse.json(
      {
        videos: result.videos,
        nextPageToken: result.continuation,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    )
  } catch (error: any) {
    console.error("[v0] Search error details:", {
      message: error.message,
      stack: error.stack,
      query,
      pageToken,
    })

    // Return a valid response even on error to prevent UI breaking
    return NextResponse.json(
      {
        error: "Failed to search music",
        message: error.message,
        videos: [],
        nextPageToken: null,
      },
      {
        status: 200, // Return 200 with empty results instead of 500 to prevent UI errors
      },
    )
  }
}
