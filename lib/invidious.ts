const INVIDIOUS_INSTANCE = "https://invidious.nerdvpn.de"

interface InvidiousVideo {
  videoId: string
  title: string
  author: string
  authorId: string
  videoThumbnails: Array<{
    quality: string
    url: string
    width: number
    height: number
  }>
  lengthSeconds: number
  viewCount: number
  published: number
}

interface InvidiousSearchResult {
  type: string
  title: string
  videoId: string
  author: string
  authorId: string
  videoThumbnails: Array<{
    quality: string
    url: string
    width: number
    height: number
  }>
  lengthSeconds: number
  viewCount: number
  published: number
}

export interface MusicVideo {
  id: string
  title: string
  artist: string
  thumbnail: string
  duration: number
  views: number
  uploadedDate: string
}

async function fetchFromInvidious(path: string): Promise<any> {
  const url = `${INVIDIOUS_INSTANCE}${path}`

  console.log(`[v0] Fetching from Invidious: ${url}`)

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "application/json",
    },
    next: { revalidate: 3600 }, // Cache for 1 hour
  })

  if (!response.ok) {
    throw new Error(`Invidious API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

function convertToMusicVideo(video: InvidiousVideo | InvidiousSearchResult): MusicVideo {
  const thumbnail =
    video.videoThumbnails?.find((t) => t.quality === "maxresdefault")?.url ||
    video.videoThumbnails?.find((t) => t.quality === "sddefault")?.url ||
    video.videoThumbnails?.[0]?.url ||
    ""

  return {
    id: video.videoId,
    title: video.title,
    artist: video.author,
    thumbnail: thumbnail.startsWith("http") ? thumbnail : `${INVIDIOUS_INSTANCE}${thumbnail}`,
    duration: video.lengthSeconds,
    views: video.viewCount || 0,
    uploadedDate: new Date(video.published * 1000).toLocaleDateString(),
  }
}

export async function searchMusic(query: string): Promise<MusicVideo[]> {
  try {
    const musicQuery = query.toLowerCase().includes("music") ? query : `${query} music`
    const results = await fetchFromInvidious(`/api/v1/search?q=${encodeURIComponent(musicQuery)}&type=video`)

    return results
      .filter((video: InvidiousSearchResult) => video.type === "video")
      .slice(0, 20)
      .map(convertToMusicVideo)
  } catch (error) {
    console.error("[v0] Invidious search error:", error)
    return []
  }
}

export async function getTrending(): Promise<MusicVideo[]> {
  try {
    const results = await fetchFromInvidious("/api/v1/trending?type=music")
    return results.slice(0, 20).map(convertToMusicVideo)
  } catch (error) {
    console.error("[v0] Invidious trending error:", error)
    return []
  }
}

export async function getPopularMusic(): Promise<MusicVideo[]> {
  try {
    const results = await fetchFromInvidious("/api/v1/search?q=popular+music+2024&type=video&sort_by=view_count")
    return results
      .filter((video: InvidiousSearchResult) => video.type === "video")
      .slice(0, 20)
      .map(convertToMusicVideo)
  } catch (error) {
    console.error("[v0] Invidious popular music error:", error)
    return []
  }
}

export async function getMusicByGenre(genre: string): Promise<MusicVideo[]> {
  try {
    const results = await fetchFromInvidious(
      `/api/v1/search?q=${encodeURIComponent(genre + " music")}&type=video&sort_by=view_count`,
    )
    return results
      .filter((video: InvidiousSearchResult) => video.type === "video")
      .slice(0, 20)
      .map(convertToMusicVideo)
  } catch (error) {
    console.error(`[v0] Invidious ${genre} music error:`, error)
    return []
  }
}
