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

class YouTubeMusicAPI {
  private apiKey: string
  private baseUrl = "https://www.googleapis.com/youtube/v3"

  constructor(apiKey: string) {
    this.apiKey = apiKey
    console.log("[v0] YouTube API initialized with key:", apiKey ? "✓ Present" : "✗ Missing")
  }

  async search(query: string, maxResults = 25): Promise<YouTubeSearchResponse> {
    console.log("[v0] YouTube API search:", { query, maxResults, apiKey: this.apiKey ? "present" : "missing" })

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
        throw new Error(`API Error: ${response.status}`)
      }

      const data = await response.json()
      console.log("[v0] YouTube API raw response:", { itemCount: data.items?.length || 0 })

      if (!data.items || data.items.length === 0) {
        console.log("[v0] YouTube API: No results found, using fallback")
        return this.getFallbackResults(query)
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
      return this.getFallbackResults(query)
    }
  }

  async getTrending(maxResults = 25): Promise<YouTubeSearchResponse> {
    console.log("[v0] YouTube API trending:", { maxResults })

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
      return this.getFallbackResults()
    }
  }

  private getFallbackResults(query?: string): YouTubeSearchResponse {
    console.log("[v0] YouTube API: Using fallback data for query:", query)

    let results = [...FALLBACK_MUSIC_DATA]

    if (query) {
      const searchTerms = query.toLowerCase().split(" ")
      results = results.filter((song) =>
        searchTerms.some((term) => song.title.toLowerCase().includes(term) || song.artist.toLowerCase().includes(term)),
      )

      // If no matches, return random selection
      if (results.length === 0) {
        results = FALLBACK_MUSIC_DATA.slice(0, 4)
      }
    }

    return { videos: results.slice(0, 8) }
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
