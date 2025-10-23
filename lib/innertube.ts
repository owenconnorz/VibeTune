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
  const timeoutId = setTimeout(() => controller.abort(), 10000)

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

    if (thumbnail && thumbnail.startsWith("//")) {
      thumbnail = `https:${thumbnail}`
    }

    if (!thumbnail) {
      thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
    }

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

    const searchWithTimeout = async (query: string, title: string, type: string) => {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Search timeout: ${query}`)), 5000)
      })

      try {
        const result = (await Promise.race([searchMusic(query), timeoutPromise])) as any

        return { title, result, type, query }
      } catch (error: any) {
        console.error(`[v0] Search failed for "${query}":`, error.message)
        return { title, result: { videos: [], continuation: null }, type, query }
      }
    }

    const searchPromises = [
      searchWithTimeout("trending music 2024", "Quick picks", "list"),
      searchWithTimeout("popular music 2024", "Popular Music", "carousel"),
      searchWithTimeout("feel good music", "Feel Good", "carousel"),
    ]

    const results = await Promise.all(searchPromises)

    results.forEach((searchResult) => {
      const { title, result, type, query } = searchResult
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
      params: "8AEB",
    })

    if (!data || !data.streamingData) {
      console.error("[v0] No streaming data available")
      return null
    }

    const adaptiveFormats = data.streamingData.adaptiveFormats || []

    const audioFormats = adaptiveFormats.filter((format: any) => format.mimeType?.includes("audio") && format.url)

    if (audioFormats.length === 0) {
      console.error("[v0] No audio formats available")
      return null
    }

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

export async function getPlaylistDetails(playlistId: string) {
  try {
    console.log("[v0] Fetching playlist:", playlistId)

    let browseId = playlistId
    if (!playlistId.startsWith("VL")) {
      browseId = `VL${playlistId}`
    }

    const data = await makeInnerTubeRequest("browse", {
      browseId: browseId,
    })

    if (!data) {
      console.error("[v0] No data returned for playlist")
      return null
    }

    const header = data.header?.musicDetailHeaderRenderer || data.header?.musicEditablePlaylistDetailHeaderRenderer

    const title = header?.title?.runs?.[0]?.text || "Untitled Playlist"
    const description = header?.description?.runs?.[0]?.text || ""
    const thumbnail = header?.thumbnail?.croppedSquareThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)[0]?.url || ""

    const contents =
      data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer
        ?.contents ||
      data.contents?.twoColumnBrowseResultsRenderer?.secondaryContents?.sectionListRenderer?.contents ||
      []

    const videos: any[] = []
    let totalPages = 0
    let hadContinuation = false
    let lastError: string | null = null

    for (const section of contents) {
      const shelf = section.musicShelfRenderer || section.musicPlaylistShelfRenderer
      if (!shelf) continue

      const items = shelf.contents || []
      totalPages = 1
      console.log("[v0] Processing", items.length, "items from initial page")

      for (const item of items) {
        const videoInfo = extractVideoInfo(item)
        if (videoInfo) {
          videos.push(videoInfo)
        }
      }

      console.log("[v0] ===== SHELF STRUCTURE DEBUG =====")
      console.log("[v0] Shelf keys:", Object.keys(shelf))
      console.log("[v0] Has continuations?", "continuations" in shelf)

      if (shelf.continuations) {
        console.log("[v0] Continuations array length:", shelf.continuations.length)
        console.log("[v0] First continuation keys:", Object.keys(shelf.continuations[0] || {}))
        console.log("[v0] First continuation:", JSON.stringify(shelf.continuations[0], null, 2))
      } else {
        console.log("[v0] No continuations property found")
        console.log("[v0] Full shelf structure:", JSON.stringify(shelf, null, 2).substring(0, 1000))
      }
      console.log("[v0] ===== END SHELF STRUCTURE DEBUG =====")

      let continuationToken = shelf.continuations?.[0]?.nextContinuationData?.continuation
      if (continuationToken) {
        hadContinuation = true
        console.log(`[v0] Found continuation token, will fetch more pages`)
      } else {
        console.log(`[v0] No continuation token found - playlist might have only ${videos.length} items`)
      }

      while (continuationToken) {
        totalPages++
        console.log(`[v0] Fetching page ${totalPages}...`)

        try {
          const continuationData = await makeInnerTubeRequest("browse", {
            continuation: continuationToken,
          })

          if (!continuationData) {
            lastError = `No data for page ${totalPages}`
            console.error(`[v0] ${lastError}`)
            break
          }

          const continuationContents =
            continuationData.continuationContents?.musicPlaylistShelfContinuation?.contents || []

          console.log(`[v0] Page ${totalPages}: ${continuationContents.length} items`)

          for (const item of continuationContents) {
            const videoInfo = extractVideoInfo(item)
            if (videoInfo) {
              videos.push(videoInfo)
            }
          }

          console.log(`[v0] Total videos so far: ${videos.length}`)

          continuationToken =
            continuationData.continuationContents?.musicPlaylistShelfContinuation?.continuations?.[0]
              ?.nextContinuationData?.continuation

          if (!continuationToken) {
            console.log(`[v0] No more pages - fetched all ${totalPages} pages, total: ${videos.length} videos`)
          }
        } catch (error: any) {
          lastError = error.message
          console.error(`[v0] Error fetching page ${totalPages}:`, error.message)
          break
        }
      }
    }

    console.log("[v0] Playlist complete:", title, "-", videos.length, "videos")
    console.log(
      `[v0] Pagination summary: ${totalPages} pages fetched, hadContinuation: ${hadContinuation}, lastError: ${lastError || "none"}`,
    )

    return {
      id: playlistId,
      title,
      description,
      thumbnail,
      videos,
      _debug: {
        totalPages,
        hadContinuation,
        lastError,
        videoCount: videos.length,
      },
    }
  } catch (error: any) {
    console.error("[v0] Playlist fetch error:", error.message)
    throw error
  }
}
