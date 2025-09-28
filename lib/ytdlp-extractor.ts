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

  /** Get trending music videos from YouTube */
  async getTrending(maxResults = 25): Promise<YtDlpSong[]> {
    const response = await fetch(
      `${this.YOUTUBE_BASE_URL}/videos?part=snippet,contentDetails&chart=mostPopular&videoCategoryId=10&regionCode=US&maxResults=${maxResults}&key=${this.YOUTUBE_API_KEY}`
    )
    if (!response.ok) throw new Error(`YouTube API error: ${response.status}`)
    const data = await response.json()

    const songs: YtDlpSong[] = []
    for (const item of data.items) {
      const song = await this.convertToSongFromApi(item)
      songs.push(song)
    }
    return songs
  }

  /** Search music videos on YouTube */
  async search(query: string, maxResults = 15): Promise<YtDlpSong[]> {
    const response = await fetch(
      `${this.YOUTUBE_BASE_URL}/search?part=snippet&q=${encodeURIComponent(
        query + " music"
      )}&type=video&videoCategoryId=10&maxResults=${maxResults}&key=${this.YOUTUBE_API_KEY}`
    )
    if (!response.ok) throw new Error(`YouTube API error: ${response.status}`)
    const data = await response.json()

    const songs: YtDlpSong[] = []
    for (const item of data.items) {
      const song = await this.convertToSongFromSearch(item)
      songs.push(song)
    }
    return songs
  }

  /** Get playlist videos from YouTube */
  async getPlaylist(playlistId: string, maxResults = 50): Promise<YtDlpSong[]> {
    const response = await fetch(
      `${this.YOUTUBE_BASE_URL}/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=${maxResults}&key=${this.YOUTUBE_API_KEY}`
    )
    if (!response.ok) throw new Error(`YouTube API error: ${response.status}`)
    const data = await response.json()

    const songs: YtDlpSong[] = []
    for (const item of data.items) {
      const song = await this.convertToSongFromPlaylist(item)
      songs.push(song)
    }
    return songs
  }

  /** Get video info (metadata only) */
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

  /** Get audio URL via Vercel audio proxy */
  async getAudioUrl(videoId: string): Promise<string | null> {
    try {
      const response = await fetch(`/api/audio/${videoId}`)
      if (!response.ok) return null
      const data = await response.json()
      return data.audioUrl || null
    } catch (err) {
      console.error("Failed to get audio URL:", err)
      return null
    }
  }

  /** Convert YouTube API trending item to song */
  private async convertToSongFromApi(item: any): Promise<YtDlpSong> {
    const audioUrl = await this.getAudioUrl(item.id)
    return {
      id: item.id,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails?.high?.url || "",
      duration: this.formatDuration(
        this.parseDurationToSeconds(item.contentDetails.duration)
      ),
      url: `https://www.youtube.com/watch?v=${item.id}`,
      audioUrl: audioUrl || "",
      formats: [],
    }
  }

  /** Convert YouTube search result to song */
  private async convertToSongFromSearch(item: any): Promise<YtDlpSong> {
    const videoId = item.id.videoId
    const audioUrl = await this.getAudioUrl(videoId)
    return {
      id: videoId,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails?.high?.url || "",
      duration: "Unknown",
      url: `https://www.youtube.com/watch?v=${videoId}`,
      audioUrl: audioUrl || "",
      formats: [],
    }
  }

  /** Convert playlist item to song */
  private async convertToSongFromPlaylist(item: any): Promise<YtDlpSong> {
    const videoId = item.snippet.resourceId.videoId
    const audioUrl = await this.getAudioUrl(videoId)
    return {
      id: videoId,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails?.high?.url || "",
      duration: "Unknown",
      url: `https://www.youtube.com/watch?v=${videoId}`,
      audioUrl: audioUrl || "",
      formats: [],
    }
  }

  /** ISO 8601 PT1H2M3S → seconds */
  private parseDurationToSeconds(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return 0
    const hours = parseInt(match[1] || "0")
    const minutes = parseInt(match[2] || "0")
    const seconds = parseInt(match[3] || "0")
    return hours * 3600 + minutes * 60 + seconds
  }

  /** seconds → mm:ss or hh:mm:ss */
  private formatDuration(seconds: number): string {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return hrs > 0
      ? `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
      : `${mins}:${secs.toString().padStart(2, "0")}`
  }
}

export const createYtDlpExtractor = () => new YtDlpExtractor()
export const ytDlpExtractor = new YtDlpExtractor()