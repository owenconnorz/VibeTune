import { youtubeMusicScraper } from "./youtube-music-scraper"

interface SearchOptions {
  pageToken?: string
}

interface YouTubeSearchResult {
  tracks: any[]
  nextPageToken?: string
  totalCount: number
}

export async function searchYouTube(query: string, options: SearchOptions = {}): Promise<YouTubeSearchResult> {
  try {
    console.log(`[v0] YouTube search: ${query}`)
    
    // Use the YouTube Music scraper for search
    const result = await youtubeMusicScraper.search(query, 1, 20, {
      type: "all",
      fallbackToOldAPI: true,
    })

    return {
      tracks: result.tracks,
      nextPageToken: result.hasNextPage ? `page_${Date.now()}` : undefined,
      totalCount: result.totalCount,
    }
  } catch (error) {
    console.error("[v0] YouTube search error:", error)
    return {
      tracks: [],
      totalCount: 0,
    }
  }
}