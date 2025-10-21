import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("q")
  const pageToken = searchParams.get("pageToken")

  if (!query) {
    return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
  }

  try {
    console.log("[v0] Searching for:", query, "pageToken:", pageToken || "none")

    const apiKey = process.env.YOUTUBE_API_KEY
    if (!apiKey) {
      console.error("[v0] YouTube API key not found")
      return NextResponse.json({ error: "API key not configured", videos: [], nextPageToken: null }, { status: 500 })
    }

    let searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&maxResults=20&key=${apiKey}`
    if (pageToken) {
      searchUrl += `&pageToken=${pageToken}`
    }

    const searchResponse = await fetch(searchUrl)

    if (!searchResponse.ok) {
      const errorData = await searchResponse.json().catch(() => ({}))
      console.error("[v0] YouTube API search failed:", searchResponse.status, errorData)

      if (searchResponse.status === 403 && errorData.error?.errors?.[0]?.reason === "quotaExceeded") {
        return NextResponse.json(
          {
            error: "YouTube API quota exceeded. Please try again later.",
            quotaExceeded: true,
            videos: [],
            nextPageToken: null,
          },
          { status: 403 },
        )
      }

      return NextResponse.json(
        {
          error: `YouTube API error: ${searchResponse.status}`,
          videos: [],
          nextPageToken: null,
        },
        { status: searchResponse.status },
      )
    }

    const searchData = await searchResponse.json()

    const videoIds = searchData.items?.map((item: any) => item.id.videoId).join(",") || ""
    if (!videoIds) {
      return NextResponse.json({ videos: [], nextPageToken: null })
    }

    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoIds}&key=${apiKey}`
    const detailsResponse = await fetch(detailsUrl)

    if (!detailsResponse.ok) {
      const errorData = await detailsResponse.json().catch(() => ({}))
      console.error("[v0] YouTube API details failed:", detailsResponse.status, errorData)

      if (detailsResponse.status === 403 && errorData.error?.errors?.[0]?.reason === "quotaExceeded") {
        return NextResponse.json(
          {
            error: "YouTube API quota exceeded. Please try again later.",
            quotaExceeded: true,
            videos: [],
            nextPageToken: null,
          },
          { status: 403 },
        )
      }

      return NextResponse.json(
        {
          error: `YouTube API error: ${detailsResponse.status}`,
          videos: [],
          nextPageToken: null,
        },
        { status: detailsResponse.status },
      )
    }

    const detailsData = await detailsResponse.json()

    const videos =
      detailsData.items?.map((item: any) => ({
        id: item.id,
        title: item.snippet.title,
        artist: item.snippet.channelTitle,
        channelId: item.snippet.channelId,
        thumbnail:
          item.snippet.thumbnails.maxres?.url ||
          item.snippet.thumbnails.standard?.url ||
          item.snippet.thumbnails.high?.url ||
          item.snippet.thumbnails.medium?.url ||
          item.snippet.thumbnails.default?.url,
        duration: formatDuration(item.contentDetails.duration),
      })) || []

    console.log("[v0] Found", videos.length, "videos, nextPageToken:", searchData.nextPageToken || "none")

    return NextResponse.json(
      { videos, nextPageToken: searchData.nextPageToken || null },
      {
        headers: {
          "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
        },
      },
    )
  } catch (error) {
    console.error("[v0] Search error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Search failed",
        videos: [],
        nextPageToken: null,
      },
      { status: 500 },
    )
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
