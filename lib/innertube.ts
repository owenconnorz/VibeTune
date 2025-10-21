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
    console.error(`[v0] InnerTube ${endpoint} error:`, response.status)
    throw new Error(`InnerTube API error: ${response.status}`)
  }

  return response.json()
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
    const thumbnail = renderer.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.[0]?.url
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
    return null
  }
}

export async function searchMusic(query: string, continuation?: string) {
  try {
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

    return {
      videos,
      continuation: continuationToken || null,
    }
  } catch (error: any) {
    console.error("[v0] Search error:", error.message)
    throw error
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
                thumbnail: videoThumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
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

export async function getHomeFeed() {
  try {
    const data = await makeInnerTubeRequest("browse", {
      browseId: "FEmusic_home",
    })

    const contents =
      data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer
        ?.contents || []

    const sections: any[] = []

    for (const section of contents) {
      try {
        const carouselShelf = section.musicCarouselShelfRenderer
        const immersiveCarousel = section.musicImmersiveCarouselShelfRenderer
        const shelf = section.musicShelfRenderer

        let title = ""
        const items: any[] = []
        let sectionType = "carousel" // Default type

        // Parse carousel shelf (horizontal scrolling sections)
        if (carouselShelf) {
          title = carouselShelf.header?.musicCarouselShelfBasicHeaderRenderer?.title?.runs?.[0]?.text || "Recommended"
          const shelfContents = carouselShelf.contents || []

          for (const item of shelfContents) {
            try {
              const twoRowRenderer = item.musicTwoRowItemRenderer
              if (twoRowRenderer) {
                const videoId =
                  twoRowRenderer.navigationEndpoint?.watchEndpoint?.videoId ||
                  twoRowRenderer.navigationEndpoint?.watchPlaylistEndpoint?.videoId
                const browseId = twoRowRenderer.navigationEndpoint?.browseEndpoint?.browseId
                const playlistId = twoRowRenderer.navigationEndpoint?.watchPlaylistEndpoint?.playlistId
                const itemTitle = twoRowRenderer.title?.runs?.[0]?.text
                const itemSubtitle = twoRowRenderer.subtitle?.runs?.[0]?.text
                const itemThumbnail =
                  twoRowRenderer.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)[0]?.url

                // Determine item type based on aspect ratio and navigation
                const aspectRatio = twoRowRenderer.aspectRatio || "MUSIC_TWO_ROW_ITEM_THUMBNAIL_ASPECT_RATIO_SQUARE"
                const isPlaylist = playlistId || browseId?.startsWith("VLRDCLAK") || browseId?.startsWith("VLPL")
                const isAlbum = browseId?.startsWith("MPREb_")
                const isArtist = browseId?.startsWith("UC") || browseId?.startsWith("MPLA")

                if ((videoId || browseId || playlistId) && itemTitle) {
                  items.push({
                    id: videoId || browseId || playlistId,
                    title: itemTitle,
                    artist: itemSubtitle || "Unknown Artist",
                    thumbnail: itemThumbnail || "/placeholder.svg",
                    duration: "",
                    type: isPlaylist ? "playlist" : isAlbum ? "album" : isArtist ? "artist" : "song",
                    aspectRatio: aspectRatio.includes("RECTANGLE") ? "video" : "square",
                  })
                }
                continue
              }

              const videoInfo = extractVideoInfo(item)
              if (videoInfo) {
                items.push({ ...videoInfo, type: "song", aspectRatio: "square" })
              }
            } catch (itemError) {
              continue
            }
          }
        }

        // Parse immersive carousel (large hero sections)
        if (immersiveCarousel) {
          title =
            immersiveCarousel.header?.musicImmersiveCarouselShelfBasicHeaderRenderer?.title?.runs?.[0]?.text ||
            "Featured"
          sectionType = "immersive"
          const carouselContents = immersiveCarousel.contents || []

          for (const item of carouselContents) {
            try {
              const renderer = item.musicTwoRowItemRenderer
              if (renderer) {
                const videoId = renderer.navigationEndpoint?.watchEndpoint?.videoId
                const browseId = renderer.navigationEndpoint?.browseEndpoint?.browseId
                const playlistId = renderer.navigationEndpoint?.watchPlaylistEndpoint?.playlistId
                const itemTitle = renderer.title?.runs?.[0]?.text
                const itemSubtitle = renderer.subtitle?.runs?.[0]?.text
                const itemThumbnail =
                  renderer.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)[0]?.url

                if ((videoId || browseId || playlistId) && itemTitle) {
                  items.push({
                    id: videoId || browseId || playlistId,
                    title: itemTitle,
                    artist: itemSubtitle || "",
                    thumbnail: itemThumbnail || "/placeholder.svg",
                    duration: "",
                    type: "featured",
                    aspectRatio: "wide",
                  })
                }
              }
            } catch (itemError) {
              continue
            }
          }
        }

        // Parse shelf (vertical list sections like "Quick picks")
        if (shelf) {
          title = shelf.title?.runs?.[0]?.text || "Quick picks"
          sectionType = "list"
          const shelfContents = shelf.contents || []

          for (const item of shelfContents) {
            try {
              const videoInfo = extractVideoInfo(item)
              if (videoInfo) {
                items.push({ ...videoInfo, type: "song", aspectRatio: "square" })
              }
            } catch (itemError) {
              continue
            }
          }
        }

        if (items.length > 0) {
          sections.push({
            title,
            items,
            type: sectionType,
          })
        }
      } catch (sectionError) {
        continue
      }
    }

    return { sections }
  } catch (error: any) {
    console.error("[v0] Home feed error:", error.message)
    throw error
  }
}

export { getVideoDetails as getAudioStream } from "./youtube-api"
