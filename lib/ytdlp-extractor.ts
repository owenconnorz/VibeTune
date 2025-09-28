export interface YtDlpSong {
  id: string
  title: string
  artist: string
  thumbnail: string
  duration: string
  url: string
  audioUrl: string
  formats?: YtDlpFormat[]
}

export interface YtDlpFormat {
  format_id: string
  url: string
  ext: string
  acodec: string
  abr?: number
  filesize?: number
}

export interface YtDlpVideoInfo {
  id: string
  title: string
  uploader: string
  thumbnail: string
  duration: number
  webpage_url: string
  formats: YtDlpFormat[]
}

export class YtDlpExtractor {
  private readonly YOUTUBE_API_KEY =
    process.env.YOUTUBE_API_KEY || "YOUR_DEFAULT_KEY"
  private readonly YOUTUBE_BASE_URL = "https://www.googleapis.com/youtube/v3"

  async getTrending(maxResults = 25): Promise<YtDlpSong[]> {
    const response = await fetch(
      `${this.YOUTUBE_BASE_URL}/videos?part=snippet,contentDetails&chart=mostPopular&videoCategoryId=10&regionCode=US&maxResults=${maxResults}&key=${this.YOUTUBE_API_KEY}`
    )
    if (!response.ok) throw new Error(`YouTube API error: ${response.status}`)
    const data = await response.json()
    return data.items.map((item: any) => this.convertToSongFromApi(item))
  }

  async search(query: string, maxResults = 15): Promise<YtDlpSong[]> {
    const response = await fetch(
      `${this.YOUTUBE_BASE_URL}/search?part=snippet&q=${encodeURIComponent(
        query + " music"
      )}&type=video&videoCategoryId=10&maxResults=${maxResults}&key=${this.YOUTUBE_API_KEY}`
    )
    if (!response.ok) throw new Error(`YouTube API error: ${response.status}`)
    const data = await response.json()
    return data.items.map((item: any) =>
      this.convertToSongFromSearch(item)
    )
  }

  async getPlaylist(playlistId: string, maxResults = 50): Promise<YtDlpSong[]> {
    const response = await fetch(
      `${this.YOUTUBE_BASE_URL}/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=${maxResults}&key=${this.YOUTUBE_API_KEY}`
    )
    if (!response.ok) throw new Error(`YouTube API error: ${response.status}`)
    const data = await response.json()
    return data.items.map((item: any) => this.convertToSongFromPlaylist(item))
  }

  async getVideoInfo(videoId: string): Promise<YtDlpVideoInfo | null> {
    const response = await fetch(
      `${this.YOUTUBE_BASE_URL}/videos?part=snippet,contentDetails&id=${videoId}&key=${this.YOUTUBE_API_KEY}`
    )
    if (!response.ok) return null
    const data = await response.json()
    if (!data.items || data.items.length === 0) return null
    const item = data.items[0]
    return {
      id: item.id,
      title: item.snippet.title,
      uploader: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails?.high?.url || "",
      duration: this.parseDurationToSeconds(item.contentDetails.duration),
      webpage_url: `https://www.youtube.com/watch?v=${item.id}`,
      formats: [],
    }
  }

  private convertToSongFromApi(item: any): YtDlpSong {
    return {
      id: item.id,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails?.high?.url || "",
      duration: this.formatDuration(
        this.parseDurationToSeconds(item.contentDetails.duration)
      ),
      url: `https://www.youtube.com/watch?v=${item.id}`,
      audioUrl: "",
      formats: [],
    }
  }

  private convertToSongFromSearch(item: any): YtDlpSong {
    return {
      id: item.id.videoId,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails?.high?.url || "",
      duration: "Unknown",
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      audioUrl: "",
      formats: [],
    }
  }

  private convertToSongFromPlaylist(item: any): YtDlpSong {
    return {
      id: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails?.high?.url || "",
      duration: "Unknown",
      url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
      audioUrl: "",
      formats: [],
    }
  }

  private parseDurationToSeconds(duration: string): number {
    // ISO 8601 PT1H2M3S
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return 0
    const hours = parseInt(match[1] || "0")
    const minutes = parseInt(match[2] || "0")
    const seconds = parseInt(match[3] || "0")
    return hours * 3600 + minutes * 60 + seconds
  }

  private formatDuration(seconds: number): string {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return hrs > 0
      ? `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(
          2,
          "0"
        )}`
      : `${mins}:${secs.toString().padStart(2, "0")}`
  }
}

export const createYtDlpExtractor = () => new YtDlpExtractor()
export const ytDlpExtractor = new YtDlpExtractor()