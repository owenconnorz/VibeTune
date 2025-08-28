import type { VideoPlugin, SearchOptions, SearchResult, VideoSource } from "./plugin-interface"

export class EpornerPlugin implements VideoPlugin {
  id = "eporner"
  name = "Eporner"
  version = "1.0.0"
  description = "Adult video content from Eporner"
  author = "VibeTune"
  homepage = "https://eporner.com"

  private enabled = true

  supportedSearchTypes = [
    { value: "2", label: "Search Videos" },
    { value: "5", label: "Latest Videos" },
    { value: "6", label: "Trending Videos" },
    { value: "3", label: "Long Videos" },
    { value: "4", label: "Categories" },
  ]

  async initialize(): Promise<void> {
    console.log("[v0] Eporner plugin initialized")
  }

  async search(options: SearchOptions): Promise<SearchResult> {
    const { query = "", type = "2", page = 1, perPage = 20 } = options

    try {
      const params = new URLSearchParams({
        searchType: type,
        page: page.toString(),
        per_page: perPage.toString(),
      })

      if (query && (type === "2" || type === "1" || type === "4")) {
        params.set("query", query)
      }

      if (type === "3") {
        params.set("duration", "longest")
      }

      const response = await fetch(`/api/eporner/search?${params}`)
      const data = await response.json()

      if (data.videos) {
        const videos: VideoSource[] = data.videos.map((video: any) => ({
          id: video.id,
          title: video.title,
          url: video.url,
          videoUrl: video.videoUrl,
          embed: video.embed,
          thumbnail: video.thumb,
          duration: video.length_min,
          durationSeconds: video.length_sec,
          views: video.views,
          rating: video.rate,
          added: video.added,
          keywords: video.keywords,
          source: "eporner",
        }))

        return {
          videos,
          totalCount: data.total_count || videos.length,
          currentPage: page,
          hasNextPage: data.hasNextPage || false,
        }
      } else {
        return {
          videos: [],
          totalCount: 0,
          currentPage: page,
          hasNextPage: false,
          error: data.error || "Failed to load videos",
        }
      }
    } catch (error) {
      console.error("[v0] Eporner plugin search error:", error)
      return {
        videos: [],
        totalCount: 0,
        currentPage: page,
        hasNextPage: false,
        error: `Search failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      }
    }
  }

  async getTrending(): Promise<SearchResult> {
    return this.search({ type: "6", page: 1 })
  }

  isEnabled(): boolean {
    return this.enabled
  }

  enable(): void {
    this.enabled = true
    console.log("[v0] Eporner plugin enabled")
  }

  disable(): void {
    this.enabled = false
    console.log("[v0] Eporner plugin disabled")
  }
}
