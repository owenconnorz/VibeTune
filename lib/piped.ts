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

async function fetchWithProxy(path: string): Promise<any> {
  try {
    console.log(`[v0] Fetching via proxy: ${path}`)

    const response = await fetch(`/api/proxy/piped?path=${encodeURIComponent(path)}`)

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `Proxy request failed: ${response.status}`)
    }

    const data = await response.json()
    console.log(`[v0] Proxy request succeeded for: ${path}`)
    return data
  } catch (error) {
    console.error(`[v0] Proxy request error for ${path}:`, error)
    throw error
  }
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

    const data: PipedSearchResponse = await fetchWithProxy(
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
    const data: PipedTrendingResponse = await fetchWithProxy(`/trending?region=${region}`)

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
    const data: PipedSearchResponse = await fetchWithProxy(
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
    const data: PipedSearchResponse = await fetchWithProxy(
      `/search?q=${encodeURIComponent("popular music 2024")}&filter=music_songs`,
    )

    return data.items.slice(0, 20).map(convertPipedVideo)
  } catch (error) {
    console.error("[v0] Piped popular music error:", error)
    throw error
  }
}
