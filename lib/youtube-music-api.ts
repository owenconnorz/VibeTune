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

const FALLBACK_MUSIC_DATA: YouTubeVideo[] = [
  {
    id: "dQw4w9WgXcQ",
    title: "Never Gonna Give You Up",
    artist: "Rick Astley",
    duration: "3:33",
    thumbnail: "/generic-male-singer.png",
  },
  {
    id: "9bZkp7q19f0",
    title: "Gangnam Style",
    artist: "PSY",
    duration: "4:13",
    thumbnail: "/psy-gangnam-style.png",
  },
  {
    id: "kJQP7kiw5Fk",
    title: "Despacito",
    artist: "Luis Fonsi ft. Daddy Yankee",
    duration: "4:42",
    thumbnail: "/despacito.png",
  },
  {
    id: "fJ9rUzIMcZQ",
    title: "Bohemian Rhapsody",
    artist: "Queen",
    duration: "5:55",
    thumbnail: "/queen-bohemian-rhapsody.png",
  },
  {
    id: "L_jWHffIx5E",
    title: "Smells Like Teen Spirit",
    artist: "Nirvana",
    duration: "5:01",
    thumbnail: "/nirvana-teen-spirit.png",
  },
  {
    id: "YQHsXMglC9A",
    title: "Hello",
    artist: "Adele",
    duration: "6:07",
    thumbnail: "/adele-hello.png",
  },
  {
    id: "JGwWNGJdvx8",
    title: "Shape of You",
    artist: "Ed Sheeran",
    duration: "3:53",
    thumbnail: "/ed-sheeran-shape-of-you.png",
  },
  {
    id: "4NRXx6U8ABQ",
    title: "Blinding Lights",
    artist: "The Weeknd",
    duration: "3:20",
    thumbnail: "/weeknd-blinding-lights.png",
  },
]

const QUOTA_RESET_HOUR = 8 // 8 AM UTC (midnight Pacific Time)
const ENHANCED_FALLBACK_DATA: YouTubeVideo[] = [
  {
    id: "dQw4w9WgXcQ",
    title: "Never Gonna Give You Up",
    artist: "Rick Astley",
    duration: "3:33",
    thumbnail: "/generic-male-singer.png",
  },
  {
    id: "9bZkp7q19f0",
    title: "Gangnam Style",
    artist: "PSY",
    duration: "4:13",
    thumbnail: "/psy-gangnam-style.png",
  },
  {
    id: "kJQP7kiw5Fk",
    title: "Despacito",
    artist: "Luis Fonsi ft. Daddy Yankee",
    duration: "4:42",
    thumbnail: "/despacito.png",
  },
  {
    id: "fJ9rUzIMcZQ",
    title: "Bohemian Rhapsody",
    artist: "Queen",
    duration: "5:55",
    thumbnail: "/queen-bohemian-rhapsody.png",
  },
  {
    id: "L_jWHffIx5E",
    title: "Smells Like Teen Spirit",
    artist: "Nirvana",
    duration: "5:01",
    thumbnail: "/nirvana-teen-spirit.png",
  },
  {
    id: "YQHsXMglC9A",
    title: "Hello",
    artist: "Adele",
    duration: "6:07",
    thumbnail: "/adele-hello.png",
  },
  {
    id: "JGwWNGJdvx8",
    title: "Shape of You",
    artist: "Ed Sheeran",
    duration: "3:53",
    thumbnail: "/ed-sheeran-shape-of-you.png",
  },
  {
    id: "4NRXx6U8ABQ",
    title: "Blinding Lights",
    artist: "The Weeknd",
    duration: "3:20",
    thumbnail: "/weeknd-blinding-lights.png",
  },
  {
    id: "60ItHLz5WEA",
    title: "Faded",
    artist: "Alan Walker",
    duration: "3:32",
    thumbnail: "/generic-male-singer.png",
  },
  {
    id: "hT_nvWreIhg",
    title: "Closer",
    artist: "The Chainsmokers ft. Halsey",
    duration: "4:05",
    thumbnail: "/generic-male-singer.png",
  },
  {
    id: "RgKAFK5djSk",
    title: "Wrecking Ball",
    artist: "Miley Cyrus",
    duration: "3:41",
    thumbnail: "/generic-male-singer.png",
  },
  {
    id: "CevxZvSJLk8",
    title: "Roar",
    artist: "Katy Perry",
    duration: "3:43",
    thumbnail: "/generic-male-singer.png",
  },
  {
    id: "nfWlot6h_JM",
    title: "Shake It Off",
    artist: "Taylor Swift",
    duration: "3:39",
    thumbnail: "/generic-male-singer.png",
  },
  {
    id: "iGk5fR-t5AU",
    title: "Counting Stars",
    artist: "OneRepublic",
    duration: "4:17",
    thumbnail: "/generic-male-singer.png",
  },
  {
    id: "pRpeEdMmmQ0",
    title: "Shake It Off",
    artist: "Taylor Swift",
    duration: "3:39",
    thumbnail: "/generic-male-singer.png",
  },
  {
    id: "7RMQksXpQSk",
    title: "Thinking Out Loud",
    artist: "Ed Sheeran",
    duration: "4:41",
    thumbnail: "/ed-sheeran-shape-of-you.png",
  },
]

class YouTubeMusicAPI {
  private apiKey: string
  private baseUrl = "https://www.googleapis.com/youtube/v3"
  private quotaExceeded = false
  private lastQuotaCheck = 0

  constructor(apiKey: string) {
    this.apiKey = apiKey
    console.log("[v0] YouTube API initialized with key:", apiKey ? "✓ Present" : "✗ Missing")
  }

  private checkQuotaReset(): boolean {
    const now = new Date()
    const currentHour = now.getUTCHours()
    const currentTime = now.getTime()

    // Check if we've passed the quota reset time (8 AM UTC)
    if (this.quotaExceeded && currentHour >= QUOTA_RESET_HOUR && currentTime - this.lastQuotaCheck > 3600000) {
      console.log("[v0] YouTube API quota may have reset, attempting API call")
      this.quotaExceeded = false
      this.lastQuotaCheck = currentTime
      return true
    }

    return !this.quotaExceeded
  }

  async search(query: string, maxResults = 25): Promise<YouTubeSearchResponse> {
    console.log("[v0] YouTube API search:", { query, maxResults, apiKey: this.apiKey ? "present" : "missing" })

    if (!this.checkQuotaReset()) {
      console.log("[v0] YouTube API quota exceeded, using enhanced fallback data")
      return this.getEnhancedFallbackResults(query)
    }

    try {
      const searchUrl =
        `${this.baseUrl}/search?` +
        new URLSearchParams({
          key: this.apiKey,
          part: "snippet",
          q: `${query} music`,
          type: "video",
          maxResults: maxResults.toString(),
          order: "relevance",
          videoCategoryId: "10", // Music category
        })

      console.log("[v0] YouTube API making request to:", searchUrl.replace(this.apiKey, "API_KEY_HIDDEN"))

      const response = await fetch(searchUrl)
      console.log("[v0] YouTube API response status:", response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] YouTube API error:", errorText)

        if (response.status === 403 && errorText.includes("quotaExceeded")) {
          console.log("[v0] YouTube API quota exceeded, marking for fallback mode")
          this.quotaExceeded = true
          this.lastQuotaCheck = Date.now()
        }

        throw new Error(`API Error: ${response.status}`)
      }

      const data = await response.json()
      console.log("[v0] YouTube API raw response:", { itemCount: data.items?.length || 0 })

      if (!data.items || data.items.length === 0) {
        console.log("[v0] YouTube API: No results found, using fallback")
        return this.getEnhancedFallbackResults(query)
      }

      const videoIds = data.items.map((item: any) => item.id.videoId).join(",")
      const detailsUrl =
        `${this.baseUrl}/videos?` +
        new URLSearchParams({
          key: this.apiKey,
          part: "snippet,contentDetails,statistics",
          id: videoIds,
        })

      const detailsResponse = await fetch(detailsUrl)
      const detailsData = await detailsResponse.json()

      const videos =
        detailsData.items?.map((item: any) => ({
          id: item.id,
          title: item.snippet.title,
          artist: item.snippet.channelTitle,
          duration: this.parseDuration(item.contentDetails.duration),
          thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || "/placeholder.svg",
          viewCount: item.statistics?.viewCount,
          publishedAt: item.snippet.publishedAt,
        })) || []

      console.log("[v0] YouTube API search success:", videos.length, "songs")
      return { videos }
    } catch (error) {
      console.error("[v0] YouTube API search failed:", error)
      return this.getEnhancedFallbackResults(query)
    }
  }

  async getTrending(maxResults = 25): Promise<YouTubeSearchResponse> {
    console.log("[v0] YouTube API trending:", { maxResults })

    if (!this.checkQuotaReset()) {
      console.log("[v0] YouTube API quota exceeded, using enhanced fallback trending data")
      return this.getEnhancedFallbackResults("trending hits")
    }

    try {
      const url =
        `${this.baseUrl}/videos?` +
        new URLSearchParams({
          key: this.apiKey,
          part: "snippet,contentDetails,statistics",
          chart: "mostPopular",
          videoCategoryId: "10", // Music
          maxResults: maxResults.toString(),
          regionCode: "US",
        })

      const response = await fetch(url)

      if (!response.ok) {
        if (response.status === 403) {
          const errorText = await response.text()
          if (errorText.includes("quotaExceeded")) {
            console.log("[v0] YouTube API quota exceeded, marking for fallback mode")
            this.quotaExceeded = true
            this.lastQuotaCheck = Date.now()
          }
        }
        throw new Error(`API Error: ${response.status}`)
      }

      const data = await response.json()

      const videos =
        data.items?.map((item: any) => ({
          id: item.id,
          title: item.snippet.title,
          artist: item.snippet.channelTitle,
          duration: this.parseDuration(item.contentDetails.duration),
          thumbnail: item.snippet.thumbnails?.high?.url || "/placeholder.svg",
          viewCount: item.statistics?.viewCount,
          publishedAt: item.snippet.publishedAt,
        })) || []

      console.log("[v0] YouTube API trending success:", videos.length, "songs")
      return { videos }
    } catch (error) {
      console.error("[v0] YouTube API trending failed:", error)
      return this.getEnhancedFallbackResults("trending hits")
    }
  }

  private getEnhancedFallbackResults(query?: string): YouTubeSearchResponse {
    console.log("[v0] YouTube API: Using enhanced fallback data for query:", query)

    let results = [...ENHANCED_FALLBACK_DATA]

    if (query) {
      const searchTerms = query.toLowerCase().split(" ")

      // Smart matching for common search terms
      if (searchTerms.some((term) => ["trending", "popular", "hits", "top"].includes(term))) {
        results = ENHANCED_FALLBACK_DATA.slice(0, 8) // Return top hits
      } else if (searchTerms.some((term) => ["new", "latest", "recent", "2024"].includes(term))) {
        results = ENHANCED_FALLBACK_DATA.slice(2, 10) // Return newer-style songs
      } else {
        // Filter by artist or title match
        const filtered = results.filter((song) =>
          searchTerms.some(
            (term) => song.title.toLowerCase().includes(term) || song.artist.toLowerCase().includes(term),
          ),
        )

        if (filtered.length > 0) {
          results = filtered
        } else {
          // Return random selection if no matches
          results = this.shuffleArray([...ENHANCED_FALLBACK_DATA]).slice(0, 6)
        }
      }
    } else {
      // Return shuffled selection for general requests
      results = this.shuffleArray([...ENHANCED_FALLBACK_DATA]).slice(0, 8)
    }

    return { videos: results.slice(0, 8) }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  private getFallbackResults(query?: string): YouTubeSearchResponse {
    return this.getEnhancedFallbackResults(query)
  }

  private parseDuration(duration: string): string {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return "0:00"

    const hours = Number.parseInt(match[1] || "0")
    const minutes = Number.parseInt(match[2] || "0")
    const seconds = Number.parseInt(match[3] || "0")

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }
}

export function createYouTubeMusicAPI() {
  const apiKey = process.env.YOUTUBE_API_KEY
  console.log("[v0] Creating YouTube API with key:", apiKey ? "✓ Present" : "✗ Missing")

  if (!apiKey) {
    console.error("[v0] YOUTUBE_API_KEY environment variable is missing!")
    throw new Error("YOUTUBE_API_KEY environment variable is required")
  }

  return new YouTubeMusicAPI(apiKey)
}

export type { YouTubeVideo, YouTubeSearchResponse }
