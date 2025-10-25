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
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.9",
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
    console.log(`[v0] ===== SEARCH STARTED =====`)
    console.log(`[v0] Query: "${query}"`)

    const params: any = {
      query,
      params: "EgWKAQIIAWoKEAMQBBAJEAoQBQ%3D%3D",
    }

    if (continuation) {
      params.continuation = continuation
    }

    const data = await makeInnerTubeRequest("search", params)

    if (!data || typeof data !== "object") {
      return { videos: [], continuation: null }
    }

    const contents =
      data.contents?.tabbedSearchResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents ||
      data.continuationContents?.musicShelfContinuation?.contents ||
      []

    const videos: any[] = []
    let artistResult: any = null

    for (const section of contents) {
      // Check for musicCardShelfRenderer (often contains artist results)
      if (section.musicCardShelfRenderer) {
        const cardRenderer = section.musicCardShelfRenderer
        const title = cardRenderer.title?.runs?.[0]?.text
        const subtitle = cardRenderer.subtitle?.runs?.[0]?.text
        const browseId = cardRenderer.title?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId
        let thumbnail = cardRenderer.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)[0]?.url

        if (thumbnail && thumbnail.startsWith("//")) {
          thumbnail = `https:${thumbnail}`
        }

        if (browseId && (browseId.startsWith("UC") || browseId.startsWith("MPLA")) && title) {
          console.log(`[v0] ✓ ARTIST FOUND in musicCardShelfRenderer: "${title}" (${browseId})`)
          artistResult = {
            id: browseId,
            title: title,
            artist: title,
            thumbnail: thumbnail || "/placeholder.svg",
            duration: "",
            browseId: browseId,
            type: "artist",
            subscribers: subtitle || "",
          }
          break
        }
      }

      // Check regular shelf items
      const items = section.musicShelfRenderer?.contents || []

      for (const item of items) {
        const renderer = item.musicResponsiveListItemRenderer
        if (!renderer) continue

        const browseId = renderer.navigationEndpoint?.browseEndpoint?.browseId
        const title = renderer.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text
        const secondColumn =
          renderer.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text || ""

        if (!artistResult && browseId && title) {
          // Check if it's an artist by browseId pattern
          const isArtistBrowseId = browseId.startsWith("UC") || browseId.startsWith("MPLA")

          // Check if subtitle contains artist indicators
          const hasArtistIndicators =
            secondColumn.toLowerCase().includes("subscriber") ||
            secondColumn.toLowerCase().includes("artist") ||
            secondColumn.toLowerCase().includes("million") ||
            secondColumn.toLowerCase().includes("monthly")

          if (isArtistBrowseId && (hasArtistIndicators || !secondColumn.includes("•"))) {
            let thumbnail = renderer.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)[0]?.url
            if (thumbnail && thumbnail.startsWith("//")) {
              thumbnail = `https:${thumbnail}`
            }

            console.log(`[v0] ✓ ARTIST DETECTED: "${title}" (${browseId})`)
            console.log(`[v0]   Subtitle: "${secondColumn}"`)

            artistResult = {
              id: browseId,
              title: title,
              artist: title,
              thumbnail: thumbnail || "/placeholder.svg",
              duration: "",
              browseId: browseId,
              type: "artist",
              subscribers: secondColumn,
            }
            continue
          }
        }

        // Extract regular video/song info
        const videoInfo = extractVideoInfo(item)
        if (videoInfo) {
          videos.push(videoInfo)
        }
      }
    }

    if (artistResult) {
      videos.unshift(artistResult)
      console.log(`[v0] ✓ Artist added to top of results`)
      console.log(`[v0]   Artist: ${artistResult.title}`)
      console.log(`[v0]   Subscribers: ${artistResult.subscribers}`)
    } else {
      console.log(`[v0] ✗ No artist found in search results`)
    }

    const continuationToken =
      data.contents?.tabbedSearchResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer
        ?.continuations?.[0]?.nextContinuationData?.continuation ||
      data.continuationContents?.musicShelfContinuation?.continuations?.[0]?.nextContinuationData?.continuation

    console.log(`[v0] Search complete: ${videos.length} results, artist found: ${!!artistResult}`)

    return {
      videos,
      continuation: continuationToken || null,
    }
  } catch (error: any) {
    console.error(`[v0] Search error:`, error.message)
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

export async function getAudioStream(videoId: string, quality?: "auto" | "high" | "low"): Promise<string | null> {
  try {
    console.log("[v0] Fetching audio stream for video:", videoId)

    if (!quality) {
      try {
        const settings = localStorage.getItem("playerSettings")
        if (settings) {
          const parsed = JSON.parse(settings)
          quality = parsed.audioQuality || "high"
        } else {
          quality = "high"
        }
      } catch {
        quality = "high"
      }
    }
    console.log("[v0] Using audio quality:", quality)

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

    let selectedAudio: any

    if (quality === "high") {
      // Highest quality (highest bitrate)
      selectedAudio = audioFormats[0]
      console.log("[v0] Selected HIGH quality audio")
    } else if (quality === "low") {
      // Lowest quality (lowest bitrate)
      selectedAudio = audioFormats[audioFormats.length - 1]
      console.log("[v0] Selected LOW quality audio")
    } else {
      // Auto: middle quality (balance between quality and size)
      const middleIndex = Math.floor(audioFormats.length / 2)
      selectedAudio = audioFormats[middleIndex]
      console.log("[v0] Selected AUTO quality audio (middle bitrate)")
    }

    console.log("[v0] Selected audio stream:", {
      mimeType: selectedAudio.mimeType,
      bitrate: selectedAudio.bitrate,
      audioQuality: selectedAudio.audioQuality,
      quality: quality,
    })

    return selectedAudio.url
  } catch (error: any) {
    console.error("[v0] Error fetching audio stream:", error.message)
    return null
  }
}

function parseISO8601Duration(duration: string): string {
  try {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return "0:00"

    const hours = Number.parseInt(match[1] || "0")
    const minutes = Number.parseInt(match[2] || "0")
    const seconds = Number.parseInt(match[3] || "0")

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  } catch {
    return "0:00"
  }
}

export async function getPlaylistDetailsFromYouTubeAPI(playlistId: string) {
  try {
    console.log("[v0] ===== STARTING PLAYLIST IMPORT =====")
    console.log("[v0] Using YouTube Data API v3 for reliable pagination")
    console.log("[v0] Playlist ID:", playlistId)

    const apiKey = process.env.YOUTUBE_API_KEY
    if (!apiKey) {
      throw new Error("YOUTUBE_API_KEY environment variable is not set")
    }

    const videos: any[] = []
    let pageToken: string | null = null
    let totalPages = 0
    let playlistTitle = "Untitled Playlist"
    let playlistDescription = ""
    let playlistThumbnail = ""

    // Fetch playlist metadata
    try {
      const playlistUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${apiKey}`
      const playlistResponse = await fetch(playlistUrl)

      if (!playlistResponse.ok) {
        console.error("[v0] Failed to fetch playlist metadata:", playlistResponse.status)
      } else {
        const playlistData = await playlistResponse.json()
        if (playlistData.items && playlistData.items.length > 0) {
          const snippet = playlistData.items[0].snippet
          playlistTitle = snippet.title || playlistTitle
          playlistDescription = snippet.description || ""
          playlistThumbnail = snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || ""
          console.log("[v0] Playlist title:", playlistTitle)
        }
      }
    } catch (error) {
      console.error("[v0] Error fetching playlist metadata:", error)
    }

    // Fetch all playlist items with pagination
    do {
      totalPages++
      console.log(`[v0] Fetching page ${totalPages}${pageToken ? ` (token: ${pageToken.substring(0, 20)}...)` : ""}`)

      const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems")
      url.searchParams.set("part", "snippet,contentDetails")
      url.searchParams.set("playlistId", playlistId)
      url.searchParams.set("maxResults", "50")
      url.searchParams.set("key", apiKey)
      if (pageToken) {
        url.searchParams.set("pageToken", pageToken)
      }

      const response = await fetch(url.toString())

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] YouTube API error:", response.status, errorText)
        throw new Error(`YouTube API error: ${response.status}`)
      }

      const data = await response.json()

      console.log(`[v0] Page ${totalPages}: ${data.items?.length || 0} items received`)

      if (data.items && data.items.length > 0) {
        for (const item of data.items) {
          const snippet = item.snippet
          const videoId = snippet.resourceId?.videoId

          if (!videoId) continue

          // Skip private/deleted videos
          if (snippet.title === "Private video" || snippet.title === "Deleted video") {
            console.log(`[v0] Skipping ${snippet.title}`)
            continue
          }

          const thumbnail =
            snippet.thumbnails?.maxres?.url ||
            snippet.thumbnails?.high?.url ||
            snippet.thumbnails?.medium?.url ||
            snippet.thumbnails?.default?.url ||
            `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`

          videos.push({
            id: videoId,
            title: snippet.title || "Unknown Title",
            artist: snippet.videoOwnerChannelTitle || "Unknown Artist",
            thumbnail,
            duration: "0:00",
          })
        }
      }

      pageToken = data.nextPageToken || null
      console.log(`[v0] Total videos so far: ${videos.length}`)
      console.log(`[v0] Has next page: ${!!pageToken}`)
    } while (pageToken)

    console.log("[v0] ===== FETCHING VIDEO DURATIONS =====")
    console.log(`[v0] Fetching durations for ${videos.length} videos...`)

    const videoIds = videos.map((v) => v.id)
    const batchSize = 50 // YouTube API allows max 50 IDs per request
    let durationsUpdated = 0

    for (let i = 0; i < videoIds.length; i += batchSize) {
      const batch = videoIds.slice(i, i + batchSize)
      const batchNumber = Math.floor(i / batchSize) + 1
      const totalBatches = Math.ceil(videoIds.length / batchSize)

      console.log(`[v0] Fetching duration batch ${batchNumber}/${totalBatches} (${batch.length} videos)`)

      try {
        const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${batch.join(",")}&key=${apiKey}`
        const videosResponse = await fetch(videosUrl)

        if (!videosResponse.ok) {
          console.error(`[v0] Failed to fetch durations for batch ${batchNumber}:`, videosResponse.status)
          continue
        }

        const videosData = await videosResponse.json()

        if (videosData.items) {
          for (const videoItem of videosData.items) {
            const videoId = videoItem.id
            const duration = videoItem.contentDetails?.duration

            if (duration) {
              const formattedDuration = parseISO8601Duration(duration)
              const video = videos.find((v) => v.id === videoId)
              if (video) {
                video.duration = formattedDuration
                durationsUpdated++
              }
            }
          }
        }
      } catch (error) {
        console.error(`[v0] Error fetching duration batch ${batchNumber}:`, error)
      }
    }

    console.log(`[v0] Updated ${durationsUpdated}/${videos.length} video durations`)

    console.log("[v0] ===== FETCHING INNERTUBE DATA =====")
    console.log("[v0] Getting high-quality thumbnails from InnerTube API...")

    try {
      const innertubeData = await makeInnerTubeRequest("browse", {
        browseId: `VL${playlistId}`,
      })

      const sectionListRenderer =
        innertubeData.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer

      if (sectionListRenderer) {
        const shelf =
          sectionListRenderer.contents?.[0]?.musicPlaylistShelfRenderer ||
          sectionListRenderer.contents?.[0]?.musicShelfRenderer

        if (shelf?.contents) {
          console.log(`[v0] InnerTube returned ${shelf.contents.length} items`)

          const thumbnailMap = new Map<string, string>()

          for (const item of shelf.contents) {
            const videoInfo = extractVideoInfo(item)
            if (videoInfo && videoInfo.id) {
              thumbnailMap.set(videoInfo.id, videoInfo.thumbnail)
            }
          }

          let thumbnailsUpdated = 0
          for (const video of videos) {
            const innerTubeThumbnail = thumbnailMap.get(video.id)
            if (innerTubeThumbnail) {
              video.thumbnail = innerTubeThumbnail
              thumbnailsUpdated++
            }
          }

          console.log(`[v0] Updated ${thumbnailsUpdated} videos with InnerTube thumbnails`)
        }
      }
    } catch (error) {
      console.error("[v0] Failed to fetch InnerTube data (non-fatal):", error)
      console.log("[v0] Continuing with YouTube Data API data only")
    }

    console.log("[v0] ===== PLAYLIST IMPORT COMPLETE =====")
    console.log("[v0] Total pages fetched:", totalPages)
    console.log("[v0] Total videos:", videos.length)
    console.log("[v0] Videos with durations:", videos.filter((v) => v.duration !== "0:00").length)
    console.log(
      "[v0] Sample durations:",
      videos.slice(0, 5).map((v) => `${v.title}: ${v.duration}`),
    )

    return {
      id: playlistId,
      title: playlistTitle,
      description: playlistDescription,
      thumbnail: playlistThumbnail,
      videos,
      _debug: {
        totalPages,
        videoCount: videos.length,
        durationsUpdated,
        apiVersion: "YouTube Data API v3 (full durations) + InnerTube thumbnails",
      },
    }
  } catch (error: any) {
    console.error("[v0] YouTube Data API playlist fetch error:", error.message)
    throw error
  }
}

export async function getPlaylistDetails(playlistId: string) {
  // This provides reliable pagination and can fetch all 280+ songs
  return getPlaylistDetailsFromYouTubeAPI(playlistId)
}

export async function searchYouTube(query: string, continuation?: string) {
  try {
    console.log(`[v0] Searching YouTube for: "${query}"${continuation ? " (continuation)" : ""}`)

    const params: any = {
      query,
    }

    if (continuation) {
      params.continuation = continuation
    }

    // Use regular YouTube endpoint instead of YouTube Music
    const url = `https://www.youtube.com/youtubei/v1/search`
    const body = {
      context: {
        client: {
          clientName: "WEB",
          clientVersion: "2.20250101.01.00",
          hl: "en",
          gl: "US",
        },
      },
      ...params,
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": INNERTUBE_API_KEY,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        Origin: "https://www.youtube.com",
        Referer: "https://www.youtube.com/",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[v0] YouTube search error:`, response.status, errorText)
      throw new Error(`YouTube API error: ${response.status}`)
    }

    const data = await response.json()
    console.log(`[v0] YouTube search response received for: "${query}"`)

    if (!data || typeof data !== "object") {
      console.log(`[v0] Invalid YouTube search response for: "${query}"`)
      return { videos: [], continuation: null }
    }

    const contents =
      data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents ||
      data.onResponseReceivedCommands?.[0]?.appendContinuationItemsAction?.continuationItems ||
      []

    const videos: any[] = []

    for (const section of contents) {
      try {
        const items = section.itemSectionRenderer?.contents || [section]

        for (const item of items) {
          try {
            const videoRenderer = item.videoRenderer
            if (!videoRenderer) continue

            const videoId = videoRenderer.videoId
            if (!videoId) continue

            const title = videoRenderer.title?.runs?.[0]?.text || videoRenderer.title?.simpleText
            const channelName =
              videoRenderer.ownerText?.runs?.[0]?.text || videoRenderer.shortBylineText?.runs?.[0]?.text
            const channelId =
              videoRenderer.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId ||
              videoRenderer.shortBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId

            let thumbnail = videoRenderer.thumbnail?.thumbnails?.slice(-1)[0]?.url

            if (thumbnail && thumbnail.startsWith("//")) {
              thumbnail = `https:${thumbnail}`
            }

            if (!thumbnail) {
              thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
            }

            const durationText = videoRenderer.lengthText?.simpleText || "0:00"
            const viewCount = videoRenderer.viewCountText?.simpleText || ""
            const publishedTime = videoRenderer.publishedTimeText?.simpleText || ""

            videos.push({
              id: videoId,
              title: title || "Unknown Title",
              artist: channelName || "Unknown Channel",
              thumbnail,
              duration: durationText,
              channelId: channelId || "",
              views: viewCount,
              publishedTime: publishedTime,
              type: "youtube_video",
            })
          } catch (itemError) {
            console.error("[v0] Error processing YouTube video item:", itemError)
            continue
          }
        }
      } catch (sectionError) {
        console.error("[v0] Error processing YouTube search section:", sectionError)
        continue
      }
    }

    const continuationToken =
      data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.continuations?.[0]
        ?.nextContinuationData?.continuation ||
      data.onResponseReceivedCommands?.[0]?.appendContinuationItemsAction?.continuationItems?.slice(-1)[0]
        ?.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token

    console.log(
      `[v0] YouTube search complete for "${query}": ${videos.length} videos found, continuation: ${!!continuationToken}`,
    )

    return {
      videos,
      continuation: continuationToken || null,
    }
  } catch (error: any) {
    console.error(`[v0] YouTube search error for "${query}":`, error.message)
    return { videos: [], continuation: null }
  }
}
