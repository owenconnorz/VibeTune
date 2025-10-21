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

  console.log(`[v0] InnerTube ${endpoint} request:`, JSON.stringify(body, null, 2))

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
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`[v0] InnerTube ${endpoint} error:`, response.status, errorText)
    throw new Error(`InnerTube API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  console.log(`[v0] InnerTube ${endpoint} response received`)
  return data
}

function extractVideoInfo(item: any) {
  try {
    // Try to extract from musicResponsiveListItemRenderer
    const renderer = item.musicResponsiveListItemRenderer
    if (!renderer) return null

    // Extract video ID
    const videoId =
      renderer.playlistItemData?.videoId ||
      renderer.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint
        ?.watchEndpoint?.videoId

    if (!videoId) return null

    // Extract title
    const title = renderer.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text

    // Extract artist
    const artist = renderer.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text

    // Extract thumbnail
    const thumbnail = renderer.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.[0]?.url

    // Extract duration
    const durationText =
      renderer.fixedColumns?.[0]?.musicResponsiveListItemFixedColumnRenderer?.text?.runs?.[0]?.text || "0:00"

    return {
      id: videoId,
      title: title || "Unknown Title",
      artist: artist || "Unknown Artist",
      thumbnail: thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      duration: durationText,
    }
  } catch (error) {
    console.error("[v0] Error extracting video info:", error)
    return null
  }
}

export async function searchMusic(query: string, continuation?: string) {
  try {
    console.log(`[v0] Searching InnerTube for: ${query}`)

    const params: any = {
      query,
      params: "EgWKAQIIAWoKEAMQBBAJEAoQBQ%3D%3D", // Music filter
    }

    if (continuation) {
      params.continuation = continuation
    }

    const data = await makeInnerTubeRequest("search", params)

    if (!data || typeof data !== "object") {
      console.error("[v0] Invalid InnerTube response:", data)
      return { videos: [], continuation: null }
    }

    // Extract videos from response
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
              // Check if this is an artist result
              const navigationEndpoint = artistRenderer.navigationEndpoint
              const browseId = navigationEndpoint?.browseEndpoint?.browseId

              if (browseId && (browseId.startsWith("UC") || browseId.startsWith("MPLA"))) {
                // This is likely an artist
                const title =
                  artistRenderer.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text
                const thumbnail =
                  artistRenderer.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)[0]?.url
                const subscribers =
                  artistRenderer.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text

                // Check if this looks like an artist (has "subscribers" or "Artist" in subtitle)
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

            // Otherwise, extract as video
            const videoInfo = extractVideoInfo(item)
            if (videoInfo) {
              videos.push(videoInfo)
            }
          } catch (itemError: any) {
            console.error("[v0] Error processing search item:", itemError.message)
            // Continue processing other items
          }
        }
      } catch (sectionError: any) {
        console.error("[v0] Error processing search section:", sectionError.message)
        // Continue processing other sections
      }
    }

    // Extract continuation token
    const continuationToken =
      data.contents?.tabbedSearchResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer
        ?.continuations?.[0]?.nextContinuationData?.continuation ||
      data.continuationContents?.musicShelfContinuation?.continuations?.[0]?.nextContinuationData?.continuation

    console.log(`[v0] InnerTube search returned ${videos.length} results`)

    return {
      videos,
      continuation: continuationToken || null,
    }
  } catch (error: any) {
    console.error("[v0] InnerTube search error:", {
      message: error.message,
      stack: error.stack,
      query,
      continuation,
    })
    throw error
  }
}

export async function getArtistData(browseId: string) {
  try {
    console.log(`[v0] Fetching artist data for: ${browseId}`)

    const data = await makeInnerTubeRequest("browse", {
      browseId,
    })

    const header = data.header?.musicImmersiveHeaderRenderer || data.header?.musicVisualHeaderRenderer
    const contents =
      data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer
        ?.contents || []

    // Extract artist info
    const artistName = header?.title?.runs?.[0]?.text || "Unknown Artist"
    const thumbnail = header?.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)[0]?.url || ""
    const banner = header?.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)[0]?.url || ""
    const subscribers = header?.subscriptionButton?.subscribeButtonRenderer?.subscriberCountText?.runs?.[0]?.text || ""
    const description = header?.description?.runs?.[0]?.text || ""

    // Extract top songs
    const topSongs: any[] = []
    const videos: any[] = []
    const albums: any[] = []
    const singles: any[] = []

    for (const section of contents) {
      const shelf = section.musicShelfRenderer || section.musicCarouselShelfRenderer

      if (!shelf) continue

      const title = shelf.title?.runs?.[0]?.text || ""

      // Top songs section
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

      // Videos section
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
                thumbnail: videoThumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                views: videoViews,
              })
            }
          }
        }
      }

      // Albums section
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

      // Singles section
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

    console.log(
      `[v0] Artist data extracted: ${topSongs.length} songs, ${videos.length} videos, ${albums.length} albums`,
    )

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
    console.error("[v0] Error fetching artist data:", error)
    throw error
  }
}

export async function getHomeFeed() {
  try {
    console.log("[v0] Fetching home feed from InnerTube")

    const data = await makeInnerTubeRequest("browse", {
      browseId: "FEmusic_home",
    })

    const contents =
      data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer
        ?.contents || []

    const sections: any[] = []

    for (const section of contents) {
      try {
        const shelf = section.musicCarouselShelfRenderer

        if (!shelf) continue

        const title = shelf.title?.runs?.[0]?.text || "Recommended"
        const items: any[] = []

        const shelfContents = shelf.contents || []

        for (const item of shelfContents) {
          try {
            // Try musicTwoRowItemRenderer (for albums, playlists, artists)
            const twoRowRenderer = item.musicTwoRowItemRenderer
            if (twoRowRenderer) {
              const videoId =
                twoRowRenderer.navigationEndpoint?.watchEndpoint?.videoId ||
                twoRowRenderer.navigationEndpoint?.watchPlaylistEndpoint?.videoId
              const browseId = twoRowRenderer.navigationEndpoint?.browseEndpoint?.browseId
              const itemTitle = twoRowRenderer.title?.runs?.[0]?.text
              const itemSubtitle = twoRowRenderer.subtitle?.runs?.[0]?.text
              const itemThumbnail =
                twoRowRenderer.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)[0]?.url

              if ((videoId || browseId) && itemTitle) {
                items.push({
                  id: videoId || browseId,
                  title: itemTitle,
                  artist: itemSubtitle || "Unknown Artist",
                  thumbnail: itemThumbnail || "/placeholder.svg",
                  duration: "",
                })
              }
              continue
            }

            // Try musicResponsiveListItemRenderer (for songs)
            const videoInfo = extractVideoInfo(item)
            if (videoInfo) {
              items.push(videoInfo)
            }
          } catch (itemError: any) {
            console.error("[v0] Error processing home feed item:", itemError.message)
            // Continue processing other items
          }
        }

        if (items.length > 0) {
          sections.push({
            title,
            items,
          })
        }
      } catch (sectionError: any) {
        console.error("[v0] Error processing home feed section:", sectionError.message)
        // Continue processing other sections
      }
    }

    console.log(`[v0] InnerTube home feed returned ${sections.length} sections`)

    return { sections }
  } catch (error: any) {
    console.error("[v0] InnerTube home feed error:", {
      message: error.message,
      stack: error.stack,
    })
    throw error
  }
}

export { getVideoDetails as getAudioStream } from "./youtube-api"
