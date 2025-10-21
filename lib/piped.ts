// Piped API client for YouTube content without quota limits
// Piped is an open-source YouTube proxy with REST API

import { pipedStorage, PIPED_INSTANCES } from "@/lib/piped-storage"

interface PipedVideo {
  url: string
  title: string
  thumbnail: string
  uploaderName: string
  uploaderUrl: string
  uploadedDate?: string
  duration: number
  views: number
  uploaderAvatar?: string
  uploaderVerified?: boolean
  shortDescription?: string
}

interface PipedSearchResponse {
  items: PipedVideo[]
  nextpage?: string
  suggestion?: string
  corrected?: boolean
}

interface PipedTrendingResponse extends Array<PipedVideo> {}

// Helper to extract video ID from Piped URL
function extractVideoId(url: string): string {
  const match = url.match(/\/watch\?v=([^&]+)/)
  return match ? match[1] : url.replace("/watch?v=", "")
}

// Try multiple Piped instances with fallback
async function fetchWithFallback(path: string, options?: RequestInit): Promise<any> {
  const settings = pipedStorage.getSettings()
  const errors: string[] = []

  // Try preferred instance first
  const preferredInstance = settings.preferredInstance
  const otherInstances = PIPED_INSTANCES.filter((i) => i !== preferredInstance)
  const instancesToTry = [preferredInstance, ...(settings.autoFallback ? otherInstances : [])]

  for (const instanceUrl of instancesToTry) {
    try {
      console.log(`[v0] Trying Piped instance: ${instanceUrl}${path}`)
      const response = await fetch(`${instanceUrl}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        errors.push(`${instanceUrl}: ${response.status} ${errorText}`)
        continue
      }

      const data = await response.json()
      console.log(`[v0] Piped instance ${instanceUrl} succeeded`)
      return data
    } catch (error) {
      errors.push(`${instanceUrl}: ${error}`)
      continue
    }
  }

  throw new Error(`All Piped instances failed:\n${errors.join("\n")}`)
}

// Convert Piped video to our app format
function convertPipedVideo(video: PipedVideo) {
  return {
    id: extractVideoId(video.url),
    title: video.title,
    artist: video.uploaderName,
    thumbnail: video.thumbnail,
    duration: video.duration,
    views: video.views,
    uploadedDate: video.uploadedDate,
  }
}

// Search for music
export async function searchMusic(query: string, page = 1): Promise<any> {
  try {
    // Add "music" to query if not already present
    const musicQuery = query.toLowerCase().includes("music") ? query : `${query} music`

    const data: PipedSearchResponse = await fetchWithFallback(
      `/search?q=${encodeURIComponent(musicQuery)}&filter=music_songs`,
    )

    return {
      items: data.items.map(convertPipedVideo),
      nextPage: data.nextpage,
      suggestion: data.suggestion,
    }
  } catch (error) {
    console.error("[v0] Piped search error:", error)
    throw error
  }
}

// Get trending music videos
export async function getTrending(region = "US"): Promise<any> {
  try {
    const data: PipedTrendingResponse = await fetchWithFallback(`/trending?region=${region}`)

    // Filter for music-related content
    const musicVideos = data.filter(
      (video) =>
        video.title.toLowerCase().includes("music") ||
        video.title.toLowerCase().includes("official") ||
        video.title.toLowerCase().includes("audio") ||
        video.title.toLowerCase().includes("video") ||
        video.uploaderName.toLowerCase().includes("vevo") ||
        video.uploaderName.toLowerCase().includes("records") ||
        video.uploaderName.toLowerCase().includes("music"),
    )

    return musicVideos.slice(0, 20).map(convertPipedVideo)
  } catch (error) {
    console.error("[v0] Piped trending error:", error)
    throw error
  }
}

// Get music by genre (using search)
export async function getMusicByGenre(genre: string): Promise<any> {
  try {
    const searchQuery = `${genre} music`
    const data: PipedSearchResponse = await fetchWithFallback(
      `/search?q=${encodeURIComponent(searchQuery)}&filter=music_songs`,
    )

    return data.items.slice(0, 10).map(convertPipedVideo)
  } catch (error) {
    console.error(`[v0] Piped genre search error for ${genre}:`, error)
    throw error
  }
}

// Get popular music (search for "popular music")
export async function getPopularMusic(): Promise<any> {
  try {
    const data: PipedSearchResponse = await fetchWithFallback(
      `/search?q=${encodeURIComponent("popular music 2024")}&filter=music_songs`,
    )

    return data.items.slice(0, 20).map(convertPipedVideo)
  } catch (error) {
    console.error("[v0] Piped popular music error:", error)
    throw error
  }
}
