export interface PipedStreamResponse {
  id: string
  title: string
  uploader: string
  uploaderUrl: string
  thumbnailUrl: string
  duration: number
  audioStreams: PipedAudioStream[]
  videoStreams: PipedVideoStream[]
}

export interface PipedAudioStream {
  url: string
  format: "M4A" | "WEBM"
  quality: string
  bitrate: number
}

export interface PipedVideoStream {
  url: string
  format: string
  quality: string
  fps: number
}

export interface PipedSearchResult {
  items: PipedSearchItem[]
}

export interface PipedSearchItem {
  type: "stream" | "channel" | "playlist"
  id: string
  title: string
  uploader: string
  uploaderUrl: string
  thumbnailUrl: string
  duration: number
  views: number
}

export interface SourceQualityMap {
  high: string
  medium: string
  low: string
}

export interface SourceMap {
  m4a: SourceQualityMap
  weba: SourceQualityMap
}

export class PipedClient {
  private instances = [
    "https://pipedapi.kavin.rocks",
    "https://piped-api.garudalinux.org",
    "https://pipedapi.rivo.lol",
    "https://piped-api.lunar.icu",
    "https://api-piped.mha.fi",
    "https://pipedapi.esmailelbob.xyz",
    "https://pipedapi.privacy.com.de",
    "https://api.piped.projectsegfau.lt",
  ]

  private cache = new Map<string, { data: any; timestamp: number }>()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  private async fetchWithFallback<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const cacheKey = `${endpoint}?${new URLSearchParams(params).toString()}`

    // Check cache first
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log("[v0] Piped cache hit:", cacheKey)
      return cached.data
    }

    const query = params ? `?${new URLSearchParams(params).toString()}` : ""
    const errors: string[] = []

    for (const instance of this.instances) {
      try {
        const url = `${instance}${endpoint}${query}`
        console.log("[v0] Piped API request:", url)

        const response = await fetch(url, {
          headers: {
            Accept: "application/json",
            "User-Agent": "VibeTune/1.0",
          },
          signal: AbortSignal.timeout(10000), // 10 second timeout
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()

        if (!data || (Array.isArray(data) && data.length === 0)) {
          throw new Error("Empty response from Piped instance")
        }

        // Cache successful response
        this.cache.set(cacheKey, { data, timestamp: Date.now() })
        console.log("[v0] Piped API success:", instance)

        return data
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        errors.push(`${instance}: ${errorMsg}`)
        console.log(`[v0] Piped instance ${instance} failed:`, errorMsg)
        continue
      }
    }

    throw new Error(`All Piped instances failed: ${errors.join("; ")}`)
  }

  async search(query: string, filter: "videos" | "music_songs" = "videos"): Promise<PipedSearchResult> {
    try {
      const result = await this.fetchWithFallback<any>("/search", {
        q: `${query} music`,
        filter,
      })

      if (result.items && Array.isArray(result.items)) {
        return { items: result.items }
      } else if (Array.isArray(result)) {
        return { items: result }
      } else {
        throw new Error("Invalid search response format")
      }
    } catch (error) {
      console.error("[v0] Piped search failed:", error)
      throw error
    }
  }

  async streams(videoId: string): Promise<PipedStreamResponse> {
    try {
      return await this.fetchWithFallback<PipedStreamResponse>(`/streams/${videoId}`)
    } catch (error) {
      console.error(`[v0] Piped streams failed for ${videoId}:`, error)
      throw error
    }
  }

  async trending(): Promise<any> {
    try {
      const result = await this.fetchWithFallback<any>("/trending")

      if (Array.isArray(result)) {
        return result
      } else if (result.items && Array.isArray(result.items)) {
        return result.items
      } else if (result.data && Array.isArray(result.data)) {
        return result.data
      } else {
        throw new Error("Invalid trending response format")
      }
    } catch (error) {
      console.error("[v0] Piped trending failed:", error)
      throw error
    }
  }

  // Convert Piped stream response to source map with quality levels
  static toSourceMap(manifest: PipedStreamResponse): SourceMap {
    const m4aStreams = manifest.audioStreams
      .filter((stream) => stream.format === "M4A")
      .sort((a, b) => b.bitrate - a.bitrate) // High to low bitrate

    const webmStreams = manifest.audioStreams
      .filter((stream) => stream.format === "WEBM")
      .sort((a, b) => b.bitrate - a.bitrate) // High to low bitrate

    const getQualityMap = (streams: PipedAudioStream[]): SourceQualityMap => {
      if (streams.length === 0) {
        return { high: "", medium: "", low: "" }
      }

      return {
        high: streams[0]?.url || "",
        medium: streams[Math.floor(streams.length / 2)]?.url || streams[0]?.url || "",
        low: streams[streams.length - 1]?.url || streams[0]?.url || "",
      }
    }

    return {
      m4a: getQualityMap(m4aStreams),
      weba: getQualityMap(webmStreams),
    }
  }

  // Rank search results based on relevance to track
  static rankResults(results: PipedSearchItem[], targetTrack: any): PipedSearchItem[] {
    const targetTitle = targetTrack.title?.toLowerCase() || ""
    const targetArtist = targetTrack.artist?.toLowerCase() || ""

    return results
      .filter((item) => item.type === "stream")
      .map((item) => ({
        ...item,
        relevanceScore: this.calculateRelevance(item, targetTitle, targetArtist),
      }))
      .sort((a, b) => (b as any).relevanceScore - (a as any).relevanceScore)
      .slice(0, 10) // Top 10 results
  }

  private static calculateRelevance(item: PipedSearchItem, targetTitle: string, targetArtist: string): number {
    let score = 0
    const itemTitle = item.title.toLowerCase()
    const itemUploader = item.uploader.toLowerCase()

    // Title similarity
    if (itemTitle.includes(targetTitle)) score += 50
    if (targetTitle.includes(itemTitle)) score += 30

    // Artist similarity
    if (itemUploader.includes(targetArtist)) score += 40
    if (targetArtist.includes(itemUploader)) score += 25

    // View count bonus (normalized)
    score += Math.min(item.views / 1000000, 10) // Max 10 points for views

    // Duration preference (3-6 minutes is ideal for music)
    const durationMinutes = item.duration / 60
    if (durationMinutes >= 3 && durationMinutes <= 6) score += 10

    return score
  }
}
