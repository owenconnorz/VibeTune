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
    console.log(`[v0] Continuation: ${continuation ? "YES" : "NO"}`)

    const params: any = {
      query,
      params: "EgWKAQIIAWoKEAMQBBAJEAoQBQ%3D%3D",
    }

    if (continuation) {
      params.continuation = continuation
    }

    const data = await makeInnerTubeRequest("search", params)

    if (!data || typeof data !== "object") {
      console.log("[v0] Invalid API response")
      return { videos: [], continuation: null }
    }

    const contents =
      data.contents?.tabbedSearchResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents ||
      data.continuationContents?.musicShelfContinuation?.contents ||
      []

    console.log(`[v0] Total sections in response: ${contents.length}`)

    const videos: any[] = []
    let artistResult: any = null

    if (!continuation) {
      const apiKey = process.env.YOUTUBE_API_KEY

      if (apiKey) {
        console.log(`[v0] Fetching artist from YouTube Data API...`)
        try {
          const channelSearchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(query)}&maxResults=1&key=${apiKey}`
          const channelResponse = await fetch(channelSearchUrl, {
            headers: {
              Accept: "application/json",
            },
          })

          if (channelResponse.ok) {
            const channelData = await channelResponse.json()
            if (channelData.items && channelData.items.length > 0) {
              const channel = channelData.items[0]
              const channelId = channel.id.channelId
              const channelTitle = channel.snippet.title
              const channelThumbnail = channel.snippet.thumbnails?.high?.url || channel.snippet.thumbnails?.default?.url

              console.log(`[v0] YouTube Data API found channel: "${channelTitle}" (${channelId})`)

              try {
                const channelDetailsUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${channelId}&key=${apiKey}`
                const detailsResponse = await fetch(channelDetailsUrl, {
                  headers: {
                    Accept: "application/json",
                  },
                })
                let subscribers = ""

                if (detailsResponse.ok) {
                  const detailsData = await detailsResponse.json()
                  if (detailsData.items && detailsData.items.length > 0) {
                    const subCount = Number.parseInt(detailsData.items[0].statistics.subscriberCount || "0")
                    if (subCount >= 1000000) {
                      subscribers = `${(subCount / 1000000).toFixed(1)}M subscribers`
                    } else if (subCount >= 1000) {
                      subscribers = `${(subCount / 1000).toFixed(1)}K subscribers`
                    } else {
                      subscribers = `${subCount} subscribers`
                    }
                  }
                }

                artistResult = {
                  id: channelId,
                  title: channelTitle,
                  artist: channelTitle,
                  thumbnail: channelThumbnail || "/placeholder.svg",
                  duration: "",
                  browseId: channelId,
                  type: "artist",
                  subscribers: subscribers,
                }

                console.log(`[v0] ✓✓✓ ARTIST FOUND via YouTube Data API: "${channelTitle}"`)
                console.log(`[v0]   Subscribers: ${subscribers}`)
              } catch (detailsError: any) {
                console.error(`[v0] Error fetching channel details:`, detailsError.message)
                artistResult = {
                  id: channelId,
                  title: channelTitle,
                  artist: channelTitle,
                  thumbnail: channelThumbnail || "/placeholder.svg",
                  duration: "",
                  browseId: channelId,
                  type: "artist",
                  subscribers: "",
                }
              }
            } else {
              console.log(`[v0] YouTube Data API returned no channels`)
            }
          } else {
            const errorText = await channelResponse.text()
            console.log(`[v0] YouTube Data API request failed: ${channelResponse.status}`, errorText)
          }
        } catch (error: any) {
          console.error(`[v0] YouTube Data API error:`, error.message)
        }
      } else {
        console.log(`[v0] YOUTUBE_API_KEY not found, skipping artist search`)
      }
    }

    for (let sectionIndex = 0; sectionIndex < contents.length; sectionIndex++) {
      const section = contents[sectionIndex]

      const items = section.musicShelfRenderer?.contents || []

      if (items.length > 0) {
        console.log(`[v0] Section ${sectionIndex}: Found musicShelfRenderer with ${items.length} items`)
      }

      for (const item of items) {
        const renderer = item.musicResponsiveListItemRenderer
        if (!renderer) continue

        const videoId =
          renderer.playlistItemData?.videoId ||
          renderer.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint
            ?.watchEndpoint?.videoId

        if (videoId) {
          const videoInfo = extractVideoInfo(item)
          if (videoInfo) {
            videos.push(videoInfo)
          }
        }
      }
    }

    if (artistResult) {
      videos.unshift(artistResult)
      console.log(`[v0] ===== ARTIST ADDED TO RESULTS =====`)
      console.log(`[v0] Artist: ${artistResult.title}`)
      console.log(`[v0] Type: ${artistResult.type}`)
      console.log(`[v0] BrowseId: ${artistResult.browseId}`)
      console.log(`[v0] Subscribers: ${artistResult.subscribers}`)
      console.log(`[v0] Total results: ${videos.length} (1 artist + ${videos.length - 1} songs)`)
    } else {
      console.log(`[v0] ===== NO ARTIST FOUND =====`)
      console.log(`[v0] Total song results: ${videos.length}`)
    }

    const continuationToken =
      data.contents?.tabbedSearchResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer
        ?.continuations?.[0]?.nextContinuationData?.continuation ||
      data.continuationContents?.musicShelfContinuation?.continuations?.[0]?.nextContinuationData?.continuation

    console.log(`[v0] ===== SEARCH COMPLETE =====`)
    console.log(
      `[v0] Results: ${videos.length} total (${artistResult ? "1 artist + " : ""}${videos.length - (artistResult ? 1 : 0)} songs)`,
    )
    console.log(`[v0] Continuation: ${continuationToken ? "YES" : "NO"}`)

    return {
      videos,
      continuation: continuationToken || null,
    }
  } catch (error: any) {
    console.error(`[v0] Search error:`, error.message)
    console.error(`[v0] Stack:`, error.stack)
    return { videos: [], continuation: null }
  }
}

export async function getArtistData(browseId: string) {
  try {
    console.log("[v0] ===== FETCHING ARTIST DATA =====")
    console.log("[v0] Browse ID:", browseId)

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

    console.log("[v0] Artist:", artistName)
    console.log("[v0] Subscribers:", subscribers)
    console.log("[v0] Total sections found:", contents.length)

    const topSongs: any[] = []
    const videos: any[] = []
    const albums: any[] = []
    const singles: any[] = []
    const livePerformances: any[] = []
    const featuredOn: any[] = []
    const playlistsByArtist: any[] = []
    const relatedArtists: any[] = []

    console.log("[v0] Section titles:")
    for (const section of contents) {
      const shelf = section.musicShelfRenderer || section.musicCarouselShelfRenderer
      if (shelf) {
        const title = shelf.title?.runs?.[0]?.text || ""
        console.log(`[v0]   - "${title}"`)
      }
    }

    for (const section of contents) {
      const shelf = section.musicShelfRenderer || section.musicCarouselShelfRenderer

      if (!shelf) continue

      const title = shelf.title?.runs?.[0]?.text || ""
      const titleLower = title.toLowerCase()

      console.log(`[v0] Processing section: "${title}"`)

      if (titleLower.includes("song") || titleLower.includes("track") || titleLower.includes("top")) {
        const items = shelf.contents || []
        console.log(`[v0]   -> Detected as TOP SONGS (${items.length} items)`)
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

      if (titleLower.includes("live") || titleLower.includes("performance")) {
        const items = shelf.contents || []
        console.log(`[v0]   -> Detected as LIVE PERFORMANCES (${items.length} items)`)
        for (const item of items) {
          const renderer = item.musicTwoRowItemRenderer
          if (renderer) {
            const videoId = renderer.navigationEndpoint?.watchEndpoint?.videoId
            const videoTitle = renderer.title?.runs?.[0]?.text
            const videoThumbnail =
              renderer.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)[0]?.url
            const videoSubtitle = renderer.subtitle?.runs?.[0]?.text || artistName

            if (videoId && videoTitle) {
              livePerformances.push({
                id: videoId,
                title: videoTitle,
                artist: videoSubtitle,
                thumbnail: videoThumbnail || `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
              })
            }
          }
        }
      }

      if (titleLower.includes("video") || titleLower.includes("music video")) {
        const items = shelf.contents || []
        console.log(`[v0]   -> Detected as VIDEOS (${items.length} items)`)
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

      if (titleLower.includes("album") && !titleLower.includes("single") && !titleLower.includes("ep")) {
        const items = shelf.contents || []
        console.log(`[v0]   -> Detected as ALBUMS (${items.length} items)`)
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

      if (titleLower.includes("single") || titleLower.includes("ep")) {
        const items = shelf.contents || []
        console.log(`[v0]   -> Detected as SINGLES & EPs (${items.length} items)`)
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

      if (titleLower.includes("featured") || titleLower.includes("appears on")) {
        const items = shelf.contents || []
        console.log(`[v0]   -> Detected as FEATURED ON (${items.length} items)`)
        for (const item of items) {
          const renderer = item.musicTwoRowItemRenderer
          if (renderer) {
            const playlistId = renderer.navigationEndpoint?.browseEndpoint?.browseId
            const playlistTitle = renderer.title?.runs?.[0]?.text
            const playlistThumbnail =
              renderer.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)[0]?.url
            const playlistSubtitle = renderer.subtitle?.runs?.[0]?.text || "YouTube Music"

            if (playlistId && playlistTitle) {
              featuredOn.push({
                id: playlistId,
                title: playlistTitle,
                subtitle: playlistSubtitle,
                thumbnail: playlistThumbnail || "/placeholder.svg",
              })
            }
          }
        }
      }

      if (titleLower.includes("playlist") && !titleLower.includes("featured")) {
        const items = shelf.contents || []
        console.log(`[v0]   -> Detected as PLAYLISTS BY ARTIST (${items.length} items)`)
        for (const item of items) {
          const renderer = item.musicTwoRowItemRenderer
          if (renderer) {
            const playlistId = renderer.navigationEndpoint?.browseEndpoint?.browseId
            const playlistTitle = renderer.title?.runs?.[0]?.text
            const playlistThumbnail =
              renderer.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)[0]?.url
            const playlistViews = renderer.subtitle?.runs?.[2]?.text || "0"

            if (playlistId && playlistTitle) {
              playlistsByArtist.push({
                id: playlistId,
                title: playlistTitle,
                views: playlistViews,
                thumbnail: playlistThumbnail || "/placeholder.svg",
              })
            }
          }
        }
      }

      if (
        titleLower.includes("fans") ||
        titleLower.includes("similar") ||
        titleLower.includes("related") ||
        titleLower.includes("might also like")
      ) {
        const items = shelf.contents || []
        console.log(`[v0]   -> Detected as RELATED ARTISTS (${items.length} items)`)
        for (const item of items) {
          const renderer = item.musicTwoRowItemRenderer
          if (renderer) {
            const artistId = renderer.navigationEndpoint?.browseEndpoint?.browseId
            const artistName = renderer.title?.runs?.[0]?.text
            const artistThumbnail =
              renderer.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)[0]?.url
            const artistSubtitle = renderer.subtitle?.runs?.[0]?.text || ""

            if (artistId && artistName) {
              relatedArtists.push({
                id: artistId,
                name: artistName,
                subscribers: artistSubtitle,
                thumbnail: artistThumbnail || "/placeholder.svg",
              })
            }
          }
        }
      }
    }

    console.log("[v0] ===== ARTIST DATA SUMMARY =====")
    console.log(`[v0] Top songs: ${topSongs.length}`)
    console.log(`[v0] Albums: ${albums.length}`)
    console.log(`[v0] Singles & EPs: ${singles.length}`)
    console.log(`[v0] Videos: ${videos.length}`)
    console.log(`[v0] Live performances: ${livePerformances.length}`)
    console.log(`[v0] Featured on: ${featuredOn.length}`)
    console.log(`[v0] Playlists by artist: ${playlistsByArtist.length}`)
    console.log(`[v0] Related artists: ${relatedArtists.length}`)

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
      livePerformances,
      featuredOn,
      playlistsByArtist,
      relatedArtists,
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

export async function getNewReleases() {
  try {
    console.log("[v0] Fetching new releases from YouTube Music")

    const data = await makeInnerTubeRequest("browse", {
      browseId: "FEmusic_new_releases",
    })

    const contents =
      data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer
        ?.contents || []

    const items: any[] = []

    for (const section of contents) {
      const shelf = section.musicCarouselShelfRenderer || section.musicShelfRenderer
      if (!shelf) continue

      const shelfContents = shelf.contents || []
      for (const item of shelfContents) {
        try {
          const twoRowRenderer = item.musicTwoRowItemRenderer
          if (twoRowRenderer) {
            const navigationEndpoint = twoRowRenderer.navigationEndpoint
            const itemTitle = twoRowRenderer.title?.runs?.[0]?.text
            const subtitle = twoRowRenderer.subtitle?.runs?.[0]?.text || ""
            const thumbnail =
              twoRowRenderer.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)[0]?.url

            let itemType = "album"
            let itemId = ""

            if (navigationEndpoint?.browseEndpoint) {
              itemId = navigationEndpoint.browseEndpoint.browseId
              if (itemId.startsWith("MPRE")) {
                itemType = "album"
              } else if (itemId.startsWith("VL")) {
                itemType = "playlist"
              }
            }

            if (itemId && itemTitle) {
              items.push({
                id: itemId,
                title: itemTitle,
                artist: subtitle,
                thumbnail: thumbnail || "/placeholder.svg",
                type: itemType,
                aspectRatio: "square",
                duration: "",
              })
            }
          }
        } catch {
          continue
        }
      }
    }

    console.log(`[v0] Found ${items.length} new releases`)
    return items
  } catch (error) {
    console.error("[v0] New releases error:", error)
    return []
  }
}

export async function getMusicVideos() {
  try {
    console.log("[v0] Fetching music videos from YouTube Music")

    const data = await makeInnerTubeRequest("browse", {
      browseId: "FEmusic_home",
    })

    const contents =
      data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer
        ?.contents || []

    const items: any[] = []

    // Look for video sections in the home feed
    for (const section of contents) {
      const shelf = section.musicCarouselShelfRenderer || section.musicShelfRenderer
      if (!shelf) continue

      const title = shelf.title?.runs?.[0]?.text || ""
      const titleLower = title.toLowerCase()

      // Only process sections that contain "video" in the title
      if (!titleLower.includes("video")) continue

      console.log(`[v0] Found video section: "${title}"`)

      const shelfContents = shelf.contents || []
      for (const item of shelfContents) {
        try {
          const twoRowRenderer = item.musicTwoRowItemRenderer
          if (twoRowRenderer) {
            const navigationEndpoint = twoRowRenderer.navigationEndpoint
            const itemTitle = twoRowRenderer.title?.runs?.[0]?.text
            const subtitle = twoRowRenderer.subtitle?.runs?.[0]?.text || ""
            const thumbnail =
              twoRowRenderer.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)[0]?.url

            let itemId = ""

            if (navigationEndpoint?.watchEndpoint) {
              itemId = navigationEndpoint.watchEndpoint.videoId
            } else if (navigationEndpoint?.browseEndpoint) {
              itemId = navigationEndpoint.browseEndpoint.browseId
            }

            if (itemId && itemTitle) {
              items.push({
                id: itemId,
                title: itemTitle,
                artist: subtitle,
                thumbnail: thumbnail || "/placeholder.svg",
                type: "song",
                aspectRatio: "video",
                duration: "",
              })
            }
          }
        } catch {
          continue
        }
      }
    }

    console.log(`[v0] Found ${items.length} music videos`)
    return items
  } catch (error) {
    console.error("[v0] Music videos error:", error)
    return []
  }
}

export async function getMusicHomeFeed() {
  try {
    console.log("[v0] ===== FETCHING YOUTUBE MUSIC HOME FEED =====")
    console.log("[v0] Using InnerTube browse endpoint for authentic YT Music experience")

    const data = await makeInnerTubeRequest("browse", {
      browseId: "FEmusic_home",
    })

    if (!data || typeof data !== "object") {
      console.error("[v0] Invalid response from InnerTube")
      throw new Error("Invalid InnerTube response")
    }

    const contents =
      data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer
        ?.contents || []

    console.log(`[v0] Found ${contents.length} sections in home feed`)

    const sections: any[] = []

    for (const section of contents) {
      const shelf = section.musicCarouselShelfRenderer || section.musicShelfRenderer

      if (!shelf) continue

      const title = shelf.title?.runs?.[0]?.text || "Recommended"
      const items: any[] = []

      console.log(`[v0] Processing section: "${title}"`)

      const shelfContents = shelf.contents || []

      for (const item of shelfContents) {
        try {
          const videoInfo = extractVideoInfo(item)
          if (videoInfo) {
            items.push({
              ...videoInfo,
              type: "song",
              aspectRatio: "square",
            })
            continue
          }

          const twoRowRenderer = item.musicTwoRowItemRenderer
          if (twoRowRenderer) {
            const navigationEndpoint = twoRowRenderer.navigationEndpoint
            const itemTitle = twoRowRenderer.title?.runs?.[0]?.text
            const subtitle = twoRowRenderer.subtitle?.runs?.[0]?.text || ""
            const thumbnail =
              twoRowRenderer.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)[0]?.url

            let itemType = "playlist"
            let itemId = ""

            if (navigationEndpoint?.browseEndpoint) {
              itemId = navigationEndpoint.browseEndpoint.browseId
              if (itemId.startsWith("MPRE")) {
                itemType = "album"
              } else if (itemId.startsWith("UC") || itemId.startsWith("FEmusic_library_privately_owned_artist")) {
                itemType = "artist"
              } else if (itemId.startsWith("VL")) {
                itemType = "playlist"
              }
            } else if (navigationEndpoint?.watchEndpoint) {
              itemId = navigationEndpoint.watchEndpoint.videoId
              itemType = "song"
            }

            if (itemId && itemTitle) {
              items.push({
                id: itemId,
                title: itemTitle,
                artist: subtitle,
                thumbnail: thumbnail || "/placeholder.svg",
                type: itemType,
                aspectRatio: itemType === "artist" ? "circle" : "square",
                duration: "",
              })
            }
          }
        } catch (itemError) {
          console.error("[v0] Error processing home feed item:", itemError)
          continue
        }
      }

      if (items.length > 0) {
        sections.push({
          title,
          items: items.slice(0, 20),
          type: "carousel",
          continuation: null,
        })
        console.log(`[v0] Added section "${title}" with ${items.length} items`)
      }
    }

    console.log("[v0] ===== YOUTUBE MUSIC HOME FEED COMPLETE =====")
    console.log(`[v0] Total sections: ${sections.length}`)
    console.log(`[v0] Section titles: ${sections.map((s) => s.title).join(", ")}`)

    if (sections.length === 0) {
      console.log("[v0] No sections found, returning empty array")
      return { sections: [] }
    }

    return { sections }
  } catch (error: any) {
    console.error("[v0] ===== YOUTUBE MUSIC HOME FEED ERROR =====")
    console.error("[v0] Error:", error.message)
    console.error("[v0] Stack:", error.stack)

    return { sections: [] }
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
      selectedAudio = audioFormats[0]
      console.log("[v0] Selected HIGH quality audio")
    } else if (quality === "low") {
      selectedAudio = audioFormats[audioFormats.length - 1]
      console.log("[v0] Selected LOW quality audio")
    } else {
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
    const batchSize = 50
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

export async function getPlaylistDetailsFromInnerTube(browseId: string) {
  try {
    console.log("[v0] ===== FETCHING PLAYLIST FROM INNERTUBE =====")
    console.log("[v0] Browse ID:", browseId)

    const data = await makeInnerTubeRequest("browse", {
      browseId,
    })

    const header = data.header?.musicDetailHeaderRenderer || data.header?.musicEditablePlaylistDetailHeaderRenderer
    const contents =
      data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer
        ?.contents || []

    const playlistTitle = header?.title?.runs?.[0]?.text || "Untitled Playlist"
    const playlistDescription = header?.description?.runs?.[0]?.text || ""
    const playlistThumbnail =
      header?.thumbnail?.croppedSquareThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)[0]?.url || ""

    console.log("[v0] Playlist title:", playlistTitle)

    const videos: any[] = []

    for (const section of contents) {
      const shelf = section.musicPlaylistShelfRenderer || section.musicShelfRenderer
      if (!shelf) continue

      const items = shelf.contents || []
      console.log(`[v0] Found shelf with ${items.length} items`)

      for (const item of items) {
        const videoInfo = extractVideoInfo(item)
        if (videoInfo) {
          videos.push(videoInfo)
        }
      }
    }

    console.log("[v0] ===== INNERTUBE PLAYLIST COMPLETE =====")
    console.log("[v0] Total videos:", videos.length)

    return {
      id: browseId,
      title: playlistTitle,
      description: playlistDescription,
      thumbnail: playlistThumbnail,
      videos,
    }
  } catch (error: any) {
    console.error("[v0] InnerTube playlist fetch error:", error.message)
    throw error
  }
}

export async function getPlaylistDetails(playlistId: string) {
  try {
    // Check if this is a YouTube Music browse ID (starts with VL or MPRE)
    const isYouTubeMusicId =
      playlistId.startsWith("VL") ||
      playlistId.startsWith("MPRE") ||
      playlistId.startsWith("RDCLAK") ||
      playlistId.startsWith("OLAK")

    if (isYouTubeMusicId) {
      console.log("[v0] Detected YouTube Music playlist/album, using InnerTube API")
      // For YouTube Music playlists, use InnerTube API
      let browseId = playlistId

      // If it doesn't start with VL but is a playlist ID, add VL prefix
      if (
        !playlistId.startsWith("VL") &&
        !playlistId.startsWith("MPRE") &&
        !playlistId.startsWith("RDCLAK") &&
        !playlistId.startsWith("OLAK")
      ) {
        browseId = `VL${playlistId}`
      }

      return await getPlaylistDetailsFromInnerTube(browseId)
    } else {
      console.log("[v0] Detected regular YouTube playlist, using YouTube Data API")
      // For regular YouTube playlists, use YouTube Data API
      return await getPlaylistDetailsFromYouTubeAPI(playlistId)
    }
  } catch (error: any) {
    console.error("[v0] Failed to fetch playlist with primary method, trying fallback")

    // Try the other method as fallback
    try {
      if (playlistId.startsWith("VL") || playlistId.startsWith("MPRE")) {
        // If InnerTube failed, try YouTube Data API without VL prefix
        const cleanId = playlistId.replace(/^VL/, "")
        console.log("[v0] Trying YouTube Data API fallback with ID:", cleanId)
        return await getPlaylistDetailsFromYouTubeAPI(cleanId)
      } else {
        // If YouTube Data API failed, try InnerTube with VL prefix
        console.log("[v0] Trying InnerTube fallback with VL prefix")
        return await getPlaylistDetailsFromInnerTube(`VL${playlistId}`)
      }
    } catch (fallbackError: any) {
      console.error("[v0] Both methods failed:", fallbackError.message)
      throw new Error("Failed to fetch playlist from both InnerTube and YouTube Data API")
    }
  }
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
