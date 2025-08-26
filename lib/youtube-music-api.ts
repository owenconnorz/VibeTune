interface YouTubeVideo {
  id: string
  title: string
  artist: string
  duration: string
  thumbnail: string
  viewCount?: string
  publishedAt?: string
}

interface YouTubeSearchResponse {
  videos: YouTubeVideo[]
  nextPageToken?: string
}

class YouTubeMusicAPI {
  private apiKey: string
  private baseUrl = "https://www.googleapis.com/youtube/v3"

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  private async makeRequest(endpoint: string, params: Record<string, string>) {
    const url = new URL(`${this.baseUrl}/${endpoint}`)
    url.searchParams.append("key", this.apiKey)

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value)
    })

    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.statusText}`)
    }

    return response.json()
  }

  private formatDuration(duration: string): string {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
    if (!match) return "0:00"

    const hours = Number.parseInt(match[1]?.replace("H", "") || "0")
    const minutes = Number.parseInt(match[2]?.replace("M", "") || "0")
    const seconds = Number.parseInt(match[3]?.replace("S", "") || "0")

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  private parseVideo(item: any): YouTubeVideo {
    const snippet = item.snippet
    const contentDetails = item.contentDetails

    return {
      id: item.id.videoId || item.id,
      title: snippet.title,
      artist: snippet.channelTitle,
      duration: contentDetails ? this.formatDuration(contentDetails.duration) : "0:00",
      thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || "",
      viewCount: item.statistics?.viewCount,
      publishedAt: snippet.publishedAt,
    }
  }

  async search(query: string, maxResults = 25): Promise<YouTubeSearchResponse> {
    try {
      // Search for videos
      const searchResponse = await this.makeRequest("search", {
        part: "snippet",
        q: `${query} music`,
        type: "video",
        maxResults: maxResults.toString(),
        order: "relevance",
        videoCategoryId: "10", // Music category
      })

      if (!searchResponse.items?.length) {
        return { videos: [] }
      }

      // Get video details including duration
      const videoIds = searchResponse.items.map((item: any) => item.id.videoId).join(",")
      const detailsResponse = await this.makeRequest("videos", {
        part: "snippet,contentDetails,statistics",
        id: videoIds,
      })

      const videos = detailsResponse.items.map((item: any) => this.parseVideo(item))

      return {
        videos,
        nextPageToken: searchResponse.nextPageToken,
      }
    } catch (error) {
      console.error("YouTube Music API search error:", error)
      return { videos: [] }
    }
  }

  async getTrending(maxResults = 25): Promise<YouTubeSearchResponse> {
    try {
      const response = await this.makeRequest("videos", {
        part: "snippet,contentDetails,statistics",
        chart: "mostPopular",
        videoCategoryId: "10", // Music category
        maxResults: maxResults.toString(),
        regionCode: "US",
      })

      if (!response.items?.length) {
        return { videos: [] }
      }

      const videos = response.items.map((item: any) => this.parseVideo(item))

      return { videos }
    } catch (error) {
      console.error("YouTube Music API trending error:", error)
      return { videos: [] }
    }
  }

  async getVideoDetails(videoId: string) {
    try {
      const response = await this.makeRequest("videos", {
        part: "snippet,contentDetails,statistics",
        id: videoId,
      })

      if (!response.items?.length) {
        return null
      }

      return this.parseVideo(response.items[0])
    } catch (error) {
      console.error("YouTube Music API video details error:", error)
      return null
    }
  }
}

export function createYouTubeMusicAPI() {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY environment variable is required")
  }
  return new YouTubeMusicAPI(apiKey)
}

export type { YouTubeVideo, YouTubeSearchResponse }
