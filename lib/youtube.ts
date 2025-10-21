export interface YouTubeVideo {
  id: string
  title: string
  artist: string
  thumbnail: string
  duration: string
  channelTitle: string
}

export interface YouTubeSearchResult {
  videos: YouTubeVideo[]
  nextPageToken?: string
}

export async function searchYouTube(query: string, pageToken?: string): Promise<YouTubeSearchResult> {
  const params = new URLSearchParams({
    part: "snippet",
    q: query,
    type: "video",
    videoCategoryId: "10", // Music category
    maxResults: "20",
    key: process.env.YOUTUBE_API_KEY!,
  })

  if (pageToken) {
    params.append("pageToken", pageToken)
  }

  const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const errorMessage = errorData?.error?.message || "Failed to search YouTube"
    const error: any = new Error(errorMessage)
    error.status = response.status
    error.data = errorData
    throw error
  }

  const data = await response.json()

  // Get video details for duration
  const videoIds = data.items.map((item: any) => item.id.videoId).join(",")
  const detailsResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${process.env.YOUTUBE_API_KEY}`,
  )

  if (!detailsResponse.ok) {
    const errorData = await detailsResponse.json().catch(() => ({}))
    const errorMessage = errorData?.error?.message || "Failed to get video details"
    const error: any = new Error(errorMessage)
    error.status = detailsResponse.status
    error.data = errorData
    throw error
  }

  const detailsData = await detailsResponse.json()

  const videos: YouTubeVideo[] = data.items.map((item: any, index: number) => {
    const duration = detailsData.items[index]?.contentDetails?.duration || "PT0S"
    return {
      id: item.id.videoId,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.medium.url,
      duration: formatDuration(duration),
      channelTitle: item.snippet.channelTitle,
    }
  })

  return {
    videos,
    nextPageToken: data.nextPageToken,
  }
}

export async function getVideoDetails(videoId: string): Promise<YouTubeVideo | null> {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${process.env.YOUTUBE_API_KEY}`,
  )

  if (!response.ok) {
    return null
  }

  const data = await response.json()

  if (!data.items || data.items.length === 0) {
    return null
  }

  const item = data.items[0]

  return {
    id: item.id,
    title: item.snippet.title,
    artist: item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails.medium.url,
    duration: formatDuration(item.contentDetails.duration),
    channelTitle: item.snippet.channelTitle,
  }
}

function formatDuration(duration: string): string {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)

  if (!match) return "0:00"

  const hours = (match[1] || "").replace("H", "")
  const minutes = (match[2] || "").replace("M", "")
  const seconds = (match[3] || "").replace("S", "")

  if (hours) {
    return `${hours}:${minutes.padStart(2, "0")}:${seconds.padStart(2, "0")}`
  }

  return `${minutes || "0"}:${seconds.padStart(2, "0")}`
}

export async function getTrendingMusic(): Promise<YouTubeVideo[]> {
  try {
    const params = new URLSearchParams({
      part: "snippet",
      chart: "mostPopular",
      videoCategoryId: "10", // Music category
      regionCode: "US",
      maxResults: "20",
      key: process.env.YOUTUBE_API_KEY!,
    })

    const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params}`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData?.error?.message || "Failed to get trending music"
      const error: any = new Error(errorMessage)
      error.status = response.status
      error.data = errorData
      throw error
    }

    const data = await response.json()

    const videos: YouTubeVideo[] = data.items.map((item: any) => ({
      id: item.id,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
      duration: formatDuration(item.contentDetails?.duration || "PT0S"),
      channelTitle: item.snippet.channelTitle,
    }))

    return videos
  } catch (error) {
    console.error("[v0] YouTube trending error:", error)
    throw error
  }
}

export async function searchMusicVideos(query: string, maxResults = 20): Promise<YouTubeVideo[]> {
  try {
    const params = new URLSearchParams({
      part: "snippet",
      q: `${query} music`,
      type: "video",
      videoCategoryId: "10", // Music category
      maxResults: maxResults.toString(),
      key: process.env.YOUTUBE_API_KEY!,
    })

    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData?.error?.message || "Failed to search music"
      const error: any = new Error(errorMessage)
      error.status = response.status
      error.data = errorData
      throw error
    }

    const data = await response.json()

    // Get video details for duration
    const videoIds = data.items.map((item: any) => item.id.videoId).join(",")

    if (!videoIds) {
      return []
    }

    const detailsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${process.env.YOUTUBE_API_KEY}`,
    )

    if (!detailsResponse.ok) {
      const errorData = await detailsResponse.json().catch(() => ({}))
      const errorMessage = errorData?.error?.message || "Failed to get video details"
      const error: any = new Error(errorMessage)
      error.status = detailsResponse.status
      error.data = errorData
      throw error
    }

    const detailsData = await detailsResponse.json()

    const videos: YouTubeVideo[] = data.items.map((item: any, index: number) => {
      const duration = detailsData.items[index]?.contentDetails?.duration || "PT0S"
      return {
        id: item.id.videoId,
        title: item.snippet.title,
        artist: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
        duration: formatDuration(duration),
        channelTitle: item.snippet.channelTitle,
      }
    })

    return videos
  } catch (error) {
    console.error("[v0] YouTube search error:", error)
    throw error
  }
}
