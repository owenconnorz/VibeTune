const INNERTUBE_API_KEY = "AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30"
const INNERTUBE_CLIENT_VERSION = "1.20250101.01.00"

interface InnerTubeContext {
  client: {
    clientName: string
    clientVersion: string
    hl: string
    gl: string
  }
}

const createContext = (): InnerTubeContext => ({
  client: {
    clientName: "WEB_REMIX",
    clientVersion: INNERTUBE_CLIENT_VERSION,
    hl: "en",
    gl: "US",
  },
})

async function makeInnerTubeRequest(endpoint: string, params: any = {}) {
  const url = `https://music.youtube.com/youtubei/v1/${endpoint}`

  const body = {
    context: createContext(),
    ...params,
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": INNERTUBE_API_KEY,
        "X-Youtube-Client-Name": "67",
        "X-Youtube-Client-Version": INNERTUBE_CLIENT_VERSION,
        Origin: "https://music.youtube.com",
        Referer: "https://music.youtube.com/",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[v0] InnerTube ${endpoint} error:`, response.status, errorText)
      throw new Error(`InnerTube API error: ${response.status}`)
    }

    return response.json()
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === "AbortError") {
      console.error(`[v0] InnerTube ${endpoint} timeout after 10 seconds`)
      throw new Error(`Request timeout: ${endpoint}`)
    }
    throw error
  }
}

function extractVideoInfo(item: any) {
  try {
    const renderer = item.musicResponsiveListItemRenderer
    if (!renderer) return null

    const videoId =
      renderer.playlistItemData?.videoId ||
      renderer.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint
        ?.watchEndpoint?.videoId

    if (!videoId) return null

    const title = renderer.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text
    const artist = renderer.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text

    let thumbnail = renderer.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)[0]?.url

    // Handle protocol-relative URLs (starting with //)
    if (thumbnail && thumbnail.startsWith("//")) {
      thumbnail = `https:${thumbnail}`
    }

    // Fallback to YouTube thumbnail if not available
    if (!thumbnail) {
      thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
    }

    console.log(`[v0] Extracted thumbnail for ${videoId}:`, thumbnail)

    const durationText =
      renderer.fixedColumns?.[0]?.musicResponsiveListItemFixedColumnRenderer?.text?.runs?.[0]?.text || "0:00"

    return {
      id: videoId,
      title: title || "Unknown Title",
      artist: artist || "Unknown Artist",
      thumbnail,
      duration: durationText,
    }
  } catch (error) {
    return null
  }
}

export async function searchMusic(query: string, continuation?: string) {
  try {
    console.log(`[v0] Searching for: "${query}"${continuation ? " (continuation)" : ""}`)

    const params: any = {
      query,
      params: "EgWKAQIIAWoKEAMQBBAJEAoQBQ%3D%3D",
    }

    if (continuation) {
      params.continuation = continuation
    }

    const data = await makeInnerTubeRequest("search", params)
    console.log(`[v0] Search response received for: "${query}"`)

    if (!data || typeof data !== "object") {
      console.log(`[v0] Invalid search response for: "${query}"`)
      return { videos: [], continuation: null }
    }

    const contents =
      data.contents?.tabbedSearchResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents ||
      data.continuationContents?.musicShelfContinuation?.contents ||
      []

    const videos: any[] = []

    for (const section of contents) {
      try {
        const items = section.musicShelfRenderer?.contents || section.musicCardShelfRenderer?.contents || [section]

        for (const item of items) {
          try {
            const artistRenderer = item.musicResponsiveListItemRenderer
            if (artistRenderer) {
              const navigationEndpoint = artistRenderer.navigationEndpoint
              const browseId = navigationEndpoint?.browseEndpoint?.browseId

              if (browseId && (browseId.startsWith("UC") || browseId.startsWith("MPLA"))) {
                const title =
                  artistRenderer.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text
                const thumbnail =
                  artistRenderer.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)[0]?.url
                const subscribers =
                  artistRenderer.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text

                const isArtist =
                  subscribers?.toLowerCase().includes("subscriber") || subscribers?.toLowerCase().includes("artist")

                if (isArtist) {
                  videos.push({
                    id: browseId,
                    title: title || "Unknown Artist",
                    artist: title || "Unknown Artist",
                    thumbnail: thumbnail || "/placeholder.svg",
                    duration: "",
                    browseId: browseId,
                    type: "artist",
                  })
                  continue
                }
              }
            }

            const videoInfo = extractVideoInfo(item)
            if (videoInfo) {
              videos.push(videoInfo)
            }
          } catch (itemError) {
            continue
          }
        }
      } catch (sectionError) {
        continue
      }
    }

    const continuationToken =
      data.contents?.tabbedSearchResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer
        ?.continuations?.[0]?.nextContinuationData?.continuation ||
      data.continuationContents?.musicShelfContinuation?.continuations?.[0]?.nextContinuationData?.continuation

    console.log(
      `[v0] Search complete for "${query}": ${videos.length} items found, continuation: ${!!continuationToken}`,
    )

    return {
      videos,
      continuation: continuationToken || null,
    }
  } catch (error: any) {
    console.error(`[v0] Search error for "${query}":`, error.message)
    return { videos: [], continuation: null }
  }
}

export async function getArtistData(browseId: string) {
  try {
    const data = await makeInnerTubeRequest("browse", {
      browseId,
    })

    const header = data.header?.musicImmersiveHeaderRenderer || data.header?.musicVisualHeaderRenderer
    const contents =
      data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer
        ?.contents || []

    const artistName = header?.title?.runs?.[0]?.text || "Unknown Artist"
    const thumbnail = header?.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)[0]?.url || ""
    const banner = header?.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)[0]?.url || ""
    const subscribers = header?.subscriptionButton?.subscribeButtonRenderer?.subscriberCountText?.runs?.[0]?.text || ""
    const description = header?.description?.runs?.[0]?.text || ""

    const topSongs: any[] = []
    const videos: any[] = []
    const albums: any[] = []
    const singles: any[] = []

    for (const section of contents) {
      const shelf = section.musicShelfRenderer || section.musicCarouselShelfRenderer

      if (!shelf) continue

      const title = shelf.title?.runs?.[0]?.text || ""

      if (title.toLowerCase().includes("song") || title.toLowerCase().includes("track")) {
        const items = shelf.contents || []
        for (const item of items) {
          const videoInfo = extractVideoInfo(item)
          if (videoInfo) {
            topSongs.push({
              ...videoInfo,
              views: "0",
            })
          }
        }
      }

      if (title.toLowerCase().includes("video") || title.toLowerCase().includes("music video")) {
        const items = shelf.contents || []
        for (const item of items) {
          const renderer = item.musicTwoRowItemRenderer
          if (renderer) {
            const videoId = renderer.navigationEndpoint?.watchEndpoint?.videoId
            const videoTitle = renderer.title?.runs?.[0]?.text
            const videoThumbnail =
              renderer.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)[0]?.url
            const videoViews = renderer.subtitle?.runs?.[2]?.text || "0"

            if (videoId && videoTitle) {
              videos.push({
                id: videoId,
                title: videoTitle,
                thumbnail: videoThumbnail || `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
                views: videoViews,
              })
            }
          }
        }
      }

      if (title.toLowerCase().includes("album")) {
        const items = shelf.contents || []
        for (const item of items) {
          const renderer = item.musicTwoRowItemRenderer
          if (renderer) {
            const albumId = renderer.navigationEndpoint?.browseEndpoint?.browseId
            const albumTitle = renderer.title?.runs?.[0]?.text
            const albumThumbnail =
              renderer.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)[0]?.url
            const albumYear = renderer.subtitle?.runs?.[2]?.text || "2024"

            if (albumId && albumTitle) {
              albums.push({
                id: albumId,
                title: albumTitle,
                year: albumYear,
                thumbnail: albumThumbnail || "/placeholder.svg",
              })
            }
          }
        }
      }

      if (title.toLowerCase().includes("single") || title.toLowerCase().includes("ep")) {
        const items = shelf.contents || []
        for (const item of items) {
          const renderer = item.musicTwoRowItemRenderer
          if (renderer) {
            const singleId = renderer.navigationEndpoint?.browseEndpoint?.browseId
            const singleTitle = renderer.title?.runs?.[0]?.text
            const singleThumbnail =
              renderer.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)[0]?.url
            const singleYear = renderer.subtitle?.runs?.[2]?.text || "2024"

            if (singleId && singleTitle) {
              singles.push({
                id: singleId,
                title: singleTitle,
                year: singleYear,
                thumbnail: singleThumbnail || "/placeholder.svg",
              })
            }
          }
        }
      }
    }

    return {
      id: browseId,
      name: artistName,
      thumbnail,
      banner,
      description,
      subscribers,
      topSongs,
      videos,
      albums,
      singles,
    }
  } catch (error) {
    console.error("[v0] Artist data error:", error)
    throw error
  }
}

export async function getTrendingMusic() {
  try {
    const data = await makeInnerTubeRequest("browse", {
      browseId: "FEmusic_trending",
    })

    const contents =
      data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer
        ?.contents || []

    const items: any[] = []

    for (const section of contents) {
      const shelf = section.musicShelfRenderer || section.musicCarouselShelfRenderer
      if (!shelf) continue

      const shelfContents = shelf.contents || []
      for (const item of shelfContents) {
        try {
          const videoInfo = extractVideoInfo(item)
          if (videoInfo) {
            items.push({ ...videoInfo, type: "song", aspectRatio: "square" })
          }
        } catch {
          continue
        }
      }
    }

    return items
  } catch (error) {
    console.error("[v0] Trending music error:", error)
    return []
  }
}

export async function getCharts() {
  try {
    const data = await makeInnerTubeRequest("browse", {
      browseId: "FEmusic_charts",
    })

    const contents =
      data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer
        ?.contents || []

    const items: any[] = []

    for (const section of contents) {
      const shelf = section.musicShelfRenderer || section.musicCarouselShelfRenderer
      if (!shelf) continue

      const shelfContents = shelf.contents || []
      for (const item of shelfContents) {
        try {
          const videoInfo = extractVideoInfo(item)
          if (videoInfo) {
            items.push({ ...videoInfo, type: "song", aspectRatio: "square" })
          }
        } catch {
          continue
        }
      }
    }

    return items
  } catch (error) {
    console.error("[v0] Charts error:", error)
    return []
  }
}

export async function getHomeFeed() {
  try {
    console.log("[v0] ===== STARTING HOME FEED FETCH =====")
    console.log("[v0] Timestamp:", new Date().toISOString())

    const sections: any[] = []

    const searchPromises = [
      searchMusic("trending music 2024").then((result) => ({
        title: "Quick picks",
        result,
        type: "list",
        query: "trending music 2024",
      })),
      searchMusic("top charts 2024").then((result) => ({
        title: "Top Charts",
        result,
        type: "carousel",
        query: "top charts 2024",
      })),
      searchMusic("popular music 2024").then((result) => ({
        title: "Popular Music",
        result,
        type: "carousel",
        query: "popular music 2024",
      })),
      searchMusic("feel good music").then((result) => ({
        title: "Feel Good",
        result,
        type: "carousel",
        query: "feel good music",
      })),
      searchMusic("workout music").then((result) => ({
        title: "Workout Mix",
        result,
        type: "carousel",
        query: "workout music",
      })),
    ]

    const results = await Promise.allSettled(searchPromises)

    results.forEach((promiseResult, index) => {
      if (promiseResult.status === "fulfilled") {
        const { title, result, type, query } = promiseResult.value
        if (result.videos.length > 0) {
          sections.push({
            title,
            items: result.videos.slice(0, 10).map((item) => ({ ...item, aspectRatio: "square" })),
            type,
            continuation: result.continuation,
            query,
          })
          console.log(`[v0] ${title}: ${result.videos.length} items, continuation: ${!!result.continuation}`)
        } else {
          console.log(`[v0] ${title}: No items found`)
        }
      } else {
        console.error(`[v0] Search ${index} failed:`, promiseResult.reason)
      }
    })

    console.log("[v0] ===== HOME FEED COMPLETE =====")
    console.log("[v0] Total sections created:", sections.length)
    console.log("[v0] Section titles:", sections.map((s) => s.title).join(", "))

    if (sections.length === 0) {
      console.log("[v0] No sections created, returning fallback data")
      return {
        sections: [
          {
            title: "Popular Music",
            items: [],
            type: "carousel",
            continuation: null,
            query: "popular music 2024",
          },
        ],
      }
    }

    return { sections }
  } catch (error: any) {
    console.error("[v0] ===== HOME FEED FATAL ERROR =====")
    console.error("[v0] Error:", error.message)
    console.error("[v0] Stack:", error.stack)

    return {
      sections: [
        {
          title: "Popular Music",
          items: [],
          type: "carousel",
          continuation: null,
          query: "popular music 2024",
        },
      ],
    }
  }
}

export async function getAudioStream(videoId: string): Promise<string | null> {
  try {
    console.log("[v0] Fetching audio stream for video:", videoId)

    const data = await makeInnerTubeRequest("player", {
      videoId,
      params: "8AEB", // Audio only parameter
    })

    if (!data || !data.streamingData) {
      console.error("[v0] No streaming data available")
      return null
    }

    // Get adaptive formats (separate audio and video streams)
    const adaptiveFormats = data.streamingData.adaptiveFormats || []

    // Find the best audio-only format
    const audioFormats = adaptiveFormats.filter((format: any) => format.mimeType?.includes("audio") && format.url)

    if (audioFormats.length === 0) {
      console.error("[v0] No audio formats available")
      return null
    }

    // Sort by bitrate (highest first) and get the best quality
    audioFormats.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))
    const bestAudio = audioFormats[0]

    console.log("[v0] Found audio stream:", {
      mimeType: bestAudio.mimeType,
      bitrate: bestAudio.bitrate,
      audioQuality: bestAudio.audioQuality,
    })

    return bestAudio.url
  } catch (error: any) {
    console.error("[v0] Error fetching audio stream:", error.message)
    return null
  }
}
