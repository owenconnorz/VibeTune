import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const artistId = params.id

  try {
    const apiKey = process.env.YOUTUBE_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    // Get channel details
    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,brandingSettings&id=${artistId}&key=${apiKey}`
    const channelResponse = await fetch(channelUrl)
    const channelData = await channelResponse.json()

    if (!channelData.items?.[0]) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 })
    }

    const channel = channelData.items[0]
    const artistName = channel.snippet.title

    // Get top songs (most popular videos)
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${artistId}&type=video&order=viewCount&maxResults=10&key=${apiKey}`
    const searchResponse = await fetch(searchUrl)
    const searchData = await searchResponse.json()

    const videoIds = searchData.items?.map((item: any) => item.id.videoId).join(",") || ""
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet,statistics&id=${videoIds}&key=${apiKey}`
    const detailsResponse = await fetch(detailsUrl)
    const detailsData = await detailsResponse.json()

    const topSongs =
      detailsData.items?.map((item: any) => ({
        id: item.id,
        title: item.snippet.title,
        artist: item.snippet.channelTitle,
        thumbnail:
          item.snippet.thumbnails.maxres?.url ||
          item.snippet.thumbnails.standard?.url ||
          item.snippet.thumbnails.high?.url ||
          item.snippet.thumbnails.medium?.url,
        duration: formatDuration(item.contentDetails.duration),
        views: item.statistics.viewCount,
      })) || []

    const artist = {
      id: artistId,
      name: artistName,
      thumbnail:
        channel.snippet.thumbnails.high?.url ||
        channel.snippet.thumbnails.medium?.url ||
        channel.snippet.thumbnails.default?.url,
      banner: channel.brandingSettings?.image?.bannerExternalUrl,
      description: channel.snippet.description,
      topSongs,
    }

    return NextResponse.json(
      { artist },
      {
        headers: {
          "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
        },
      },
    )
  } catch (error) {
    console.error("[v0] Artist fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch artist" }, { status: 500 })
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
