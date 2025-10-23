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
    const thumbnail = renderer.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)[0]?.url
    const durationText =
      renderer.fixedColumns?.[0]?.musicResponsiveListItemFixedColumnRenderer?.text?.runs?.[0]?.text || "0:00"

    return {
      id: videoId,
      title: title || "Unknown Title",
      artist: artist || "Unknown Artist",
      thumbnail: thumbnail || `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
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

const GENRE_POOLS = {
  trending: ["trending music", "viral songs", "top hits 2024", "chart toppers", "popular now"],
  popular: ["popular music", "best songs", "top tracks", "hit songs", "most played"],
  mood: [
    "feel good music",
    "happy songs",
    "upbeat music",
    "energetic tracks",
    "positive vibes",
    "chill music",
    "relaxing songs",
    "calm music",
    "peaceful tracks",
    "ambient music",
  ],
  activity: [
    "workout music",
    "gym songs",
    "running music",
    "exercise tracks",
    "fitness playlist",
    "study music",
    "focus songs",
    "concentration music",
    "work playlist",
  ],
  genre: [
    "pop music",
    "rock songs",
    "hip hop tracks",
    "electronic music",
    "indie songs",
    "r&b music",
    "jazz tracks",
    "country songs",
    "latin music",
    "k-pop songs",
  ],
  era: ["80s music", "90s hits", "2000s songs", "2010s music", "classic hits", "throwback songs"],
}

// Helper to get random item from array
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

// Helper to get varied search queries
function getVariedQueries() {
  return {
    quickPicks: getRandomItem([...GENRE_POOLS.trending, ...GENRE_POOLS.popular]),
    trending: getRandomItem(GENRE_POOLS.trending),
    popular: getRandomItem([...GENRE_POOLS.popular, ...GENRE_POOLS.genre]),
    mood1: getRandomItem(GENRE_POOLS.mood),
    mood2: getRandomItem(GENRE_POOLS.mood.filter((m) => m !== GENRE_POOLS.mood[0])),
    activity: getRandomItem(GENRE_POOLS.activity),
    genre: getRandomItem(GENRE_POOLS.genre),
    era: getRandomItem(GENRE_POOLS.era),
  }
}

export async function getHomeFeed() {
  try {
    console.log("[v0] ===== STARTING HOME FEED FETCH =====")
    console.log("[v0] Timestamp:", new Date().toISOString())

    const queries = getVariedQueries()
    console.log("[v0] Using varied queries:", queries)

    const sections: any[] = []

    // Fetch quick picks with varied query
    try {
      console.log("[v0] Fetching quick picks with query:", queries.quickPicks)
      const quickPicksResults = await searchMusic(queries.quickPicks)
      console.log("[v0] Quick picks items:", quickPicksResults.videos.length)

      if (quickPicksResults.videos.length > 0) {
        sections.push({
          title: "Quick picks",
          items: quickPicksResults.videos.slice(0, 10).map((item) => ({ ...item, aspectRatio: "square" })),
          type: "list",
        })
      }
    } catch (error: any) {
      console.error("[v0] Quick picks failed:", error.message)
    }

    // Fetch trending with varied query
    try {
      console.log("[v0] Fetching trending with query:", queries.trending)
      const trendingResults = await searchMusic(queries.trending)
      console.log("[v0] Trending items:", trendingResults.videos.length)

      if (trendingResults.videos.length > 0) {
        sections.push({
          title: "Trending Now",
          items: trendingResults.videos.slice(0, 10).map((item) => ({ ...item, aspectRatio: "square" })),
          type: "carousel",
        })
      }
    } catch (error: any) {
      console.error("[v0] Trending failed:", error.message)
    }

    // Fetch popular with varied query
    try {
      console.log("[v0] Fetching popular with query:", queries.popular)
      const popularResults = await searchMusic(queries.popular)
      console.log("[v0] Popular items:", popularResults.videos.length)

      if (popularResults.videos.length > 0) {
        sections.push({
          title: "Popular Music",
          items: popularResults.videos.slice(0, 10).map((item) => ({ ...item, aspectRatio: "square" })),
          type: "carousel",
        })
      }
    } catch (error: any) {
      console.error("[v0] Popular failed:", error.message)
    }

    // Fetch first mood category with varied query
    try {
      console.log("[v0] Fetching mood music with query:", queries.mood1)
      const mood1Results = await searchMusic(queries.mood1)
      console.log("[v0] Mood 1 items:", mood1Results.videos.length)

      if (mood1Results.videos.length > 0) {
        // Capitalize first letter of each word for title
        const title = queries.mood1
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")

        sections.push({
          title,
          items: mood1Results.videos.slice(0, 10).map((item) => ({ ...item, aspectRatio: "square" })),
          type: "carousel",
        })
      }
    } catch (error: any) {
      console.error("[v0] Mood 1 failed:", error.message)
    }

    // Fetch activity category with varied query
    try {
      console.log("[v0] Fetching activity music with query:", queries.activity)
      const activityResults = await searchMusic(queries.activity)
      console.log("[v0] Activity items:", activityResults.videos.length)

      if (activityResults.videos.length > 0) {
        const title = queries.activity
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")

        sections.push({
          title,
          items: activityResults.videos.slice(0, 10).map((item) => ({ ...item, aspectRatio: "square" })),
          type: "carousel",
        })
      }
    } catch (error: any) {
      console.error("[v0] Activity failed:", error.message)
    }

    // Fetch genre category with varied query
    try {
      console.log("[v0] Fetching genre music with query:", queries.genre)
      const genreResults = await searchMusic(queries.genre)
      console.log("[v0] Genre items:", genreResults.videos.length)

      if (genreResults.videos.length > 0) {
        const title = queries.genre
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")

        sections.push({
          title,
          items: genreResults.videos.slice(0, 10).map((item) => ({ ...item, aspectRatio: "square" })),
          type: "carousel",
        })
      }
    } catch (error: any) {
      console.error("[v0] Genre failed:", error.message)
    }

    // Fetch era category with varied query
    try {
      console.log("[v0] Fetching era music with query:", queries.era)
      const eraResults = await searchMusic(queries.era)
      console.log("[v0] Era items:", eraResults.videos.length)

      if (eraResults.videos.length > 0) {
        const title = queries.era
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")

        sections.push({
          title,
          items: eraResults.videos.slice(0, 10).map((item) => ({ ...item, aspectRatio: "square" })),
          type: "carousel",
        })
      }
    } catch (error: any) {
      console.error("[v0] Era failed:", error.message)
    }

    // Fetch second mood category with varied query
    try {
      console.log("[v0] Fetching second mood with query:", queries.mood2)
      const mood2Results = await searchMusic(queries.mood2)
      console.log("[v0] Mood 2 items:", mood2Results.videos.length)

      if (mood2Results.videos.length > 0) {
        const title = queries.mood2
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")

        sections.push({
          title,
          items: mood2Results.videos.slice(0, 10).map((item) => ({ ...item, aspectRatio: "square" })),
          type: "carousel",
        })
      }
    } catch (error: any) {
      console.error("[v0] Mood 2 failed:", error.message)
    }

    console.log("[v0] ===== HOME FEED COMPLETE =====")
    console.log("[v0] Total sections created:", sections.length)
    console.log("[v0] Section titles:", sections.map((s) => s.title).join(", "))

    return { sections }
  } catch (error: any) {
    console.log("[v0] ===== HOME FEED FATAL ERROR =====")
    console.log("[v0] Error:", error.message)
    console.log("[v0] Stack:", error.stack)
    throw error
  }
}

export async function getAudioStream(videoId: string): Promise<string | null> {
  try {
    console.log("[v0] Fetching audio stream for video:", videoId)

    const data = await makeInnerTubeRequest("player", {
      videoId,
      // Removed params: "8AEB" to get all formats
    })

    console.log("[v0] Player response received:", {
      hasStreamingData: !!data?.streamingData,
      hasAdaptiveFormats: !!data?.streamingData?.adaptiveFormats,
      hasFormats: !!data?.streamingData?.formats,
      playabilityStatus: data?.playabilityStatus?.status,
    })

    if (!data) {
      console.error("[v0] No data returned from player endpoint")
      return null
    }

    if (data.playabilityStatus?.status !== "OK") {
      console.error("[v0] Video not playable:", data.playabilityStatus?.status, data.playabilityStatus?.reason)
      return null
    }

    if (!data.streamingData) {
      console.error("[v0] No streaming data in response")
      console.log("[v0] Response keys:", Object.keys(data))
      return null
    }

    const adaptiveFormats = data.streamingData.adaptiveFormats || []
    const audioFormats = adaptiveFormats.filter((format: any) => format.mimeType?.includes("audio") && format.url)

    if (audioFormats.length > 0) {
      // Sort by bitrate (highest first) and get the best quality
      audioFormats.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))
      const bestAudio = audioFormats[0]

      console.log("[v0] Found audio stream (adaptive):", {
        mimeType: bestAudio.mimeType,
        bitrate: bestAudio.bitrate,
        audioQuality: bestAudio.audioQuality,
      })

      return bestAudio.url
    }

    const formats = data.streamingData.formats || []
    const audioVideoFormats = formats.filter((format: any) => format.mimeType?.includes("audio") && format.url)

    if (audioVideoFormats.length > 0) {
      // Sort by quality and get the best one
      audioVideoFormats.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))
      const bestFormat = audioVideoFormats[0]

      console.log("[v0] Found audio stream (combined):", {
        mimeType: bestFormat.mimeType,
        bitrate: bestFormat.bitrate,
        quality: bestFormat.quality,
      })

      return bestFormat.url
    }

    console.error("[v0] No audio formats available in response")
    console.log("[v0] Adaptive formats count:", adaptiveFormats.length)
    console.log("[v0] Regular formats count:", formats.length)
    return null
  } catch (error: any) {
    console.error("[v0] Error fetching audio stream:", error.message)
    console.error("[v0] Error stack:", error.stack)
    return null
  }
}

export async function getPlaylistData(playlistId: string) {
  try {
    console.log("[v0] Fetching playlist data for:", playlistId)

    const data = await makeInnerTubeRequest("browse", {
      browseId: `VL${playlistId}`,
    })

    const header = data.header?.musicDetailHeaderRenderer || data.header?.musicEditablePlaylistDetailHeaderRenderer
    const contents =
      data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer
        ?.contents || []

    const playlistName = header?.title?.runs?.[0]?.text || "Imported Playlist"
    const playlistDescription = header?.description?.runs?.[0]?.text || ""
    const playlistThumbnail =
      header?.thumbnail?.croppedSquareThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)[0]?.url || ""

    const songs: any[] = []

    for (const section of contents) {
      const shelf = section.musicShelfRenderer || section.musicPlaylistShelfRenderer

      if (!shelf) continue

      const items = shelf.contents || []
      for (const item of items) {
        const videoInfo = extractVideoInfo(item)
        if (videoInfo) {
          songs.push(videoInfo)
        }
      }
    }

    console.log("[v0] Playlist fetched:", {
      name: playlistName,
      songsCount: songs.length,
    })

    return {
      name: playlistName,
      description: playlistDescription,
      thumbnail: playlistThumbnail,
      songs,
    }
  } catch (error) {
    console.error("[v0] Playlist fetch error:", error)
    throw error
  }
}
