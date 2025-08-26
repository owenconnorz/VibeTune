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

    console.log("[v0] YouTube API request:", url.toString())

    try {
      const response = await fetch(url.toString())

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] YouTube API error response:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        })

        // Parse error details if available
        try {
          const errorData = JSON.parse(errorText)
          if (errorData.error) {
            throw new Error(`YouTube API error: ${errorData.error.message || response.statusText} (${response.status})`)
          }
        } catch (parseError) {
          // If JSON parsing fails, use the raw error text
          throw new Error(`YouTube API error: ${response.statusText} (${response.status}): ${errorText}`)
        }
      }

      const data = await response.json()
      console.log("[v0] YouTube API response success:", {
        endpoint,
        itemCount: data.items?.length || 0,
      })

      return data
    } catch (error) {
      console.error("[v0] YouTube API request failed:", {
        endpoint,
        params,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
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
      console.log("[v0] YouTube API search starting:", { query, maxResults })

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
        console.log("[v0] YouTube API search: No items found")
        return { videos: [] }
      }

      // Get video details including duration
      const videoIds = searchResponse.items.map((item: any) => item.id.videoId).join(",")
      console.log("[v0] YouTube API: Fetching details for video IDs:", videoIds)

      const detailsResponse = await this.makeRequest("videos", {
        part: "snippet,contentDetails,statistics",
        id: videoIds,
      })

      const videos = detailsResponse.items.map((item: any) => this.parseVideo(item))
      console.log("[v0] YouTube API search completed:", { resultCount: videos.length })

      return {
        videos,
        nextPageToken: searchResponse.nextPageToken,
      }
    } catch (error) {
      console.error("[v0] YouTube Music API search error:", {
        query,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      return { videos: [] }
    }
  }

  async getTrending(maxResults = 25): Promise<YouTubeSearchResponse> {
    try {
      console.log("[v0] YouTube API trending starting:", { maxResults })

      const response = await this.makeRequest("videos", {
        part: "snippet,contentDetails,statistics",
        chart: "mostPopular",
        videoCategoryId: "10", // Music category
        maxResults: maxResults.toString(),
        regionCode: "US",
      })

      if (!response.items?.length) {
        console.log("[v0] YouTube API trending: No items found")
        return { videos: [] }
      }

      const videos = response.items.map((item: any) => this.parseVideo(item))
      console.log("[v0] YouTube API trending completed:", { resultCount: videos.length })

      return { videos }
    } catch (error) {
      console.error("[v0] YouTube Music API trending error:", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
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
      console.error("YouTube Music API video details error:", {
        videoId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
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
