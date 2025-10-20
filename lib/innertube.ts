import { Innertube } from "youtubei.js"

let innertubeInstance: Innertube | null = null

export async function getInnertube() {
  if (!innertubeInstance) {
    try {
      console.log("[v0] Initializing Innertube...")
      innertubeInstance = await Innertube.create()
      console.log("[v0] Innertube initialized successfully")
    } catch (error) {
      console.error("[v0] Failed to initialize Innertube:", error)
      throw error
    }
  }
  return innertubeInstance
}

export interface YouTubeVideo {
  id: string
  title: string
  artist: string
  thumbnail: string
  duration: string
  channelTitle: string
  audioUrl?: string
}

export interface YouTubeSearchResult {
  videos: YouTubeVideo[]
  continuation?: string
}

export interface HomeFeedSection {
  title: string
  items: YouTubeVideo[]
}

export interface HomeFeedResult {
  sections: HomeFeedSection[]
}

export async function getHomeFeed(): Promise<HomeFeedResult> {
  try {
    console.log("[v0] Getting Innertube instance...")
    const innertube = await getInnertube()
    console.log("[v0] Fetching music home feed...")
    const homeFeed = await innertube.music.getHomeFeed()
    console.log("[v0] Home feed response received")

    const sections: HomeFeedSection[] = []

    if (!homeFeed || !homeFeed.contents) {
      console.log("[v0] No contents in home feed")
      return { sections: [] }
    }

    for (const shelf of homeFeed.contents) {
      try {
        if (shelf.type === "MusicCarouselShelf" || shelf.type === "MusicShelf") {
          const title = shelf.title?.text || "Recommended"
          const items: YouTubeVideo[] = []

          for (const item of shelf.contents || []) {
            try {
              if (item.type === "MusicResponsiveListItem" || item.type === "MusicTwoRowItem") {
                const videoId = item.id
                if (!videoId) continue

                const title = item.title?.text || item.title || "Unknown Title"
                const artist = item.artists?.[0]?.name || item.subtitle?.text || "Unknown Artist"
                const thumbnail = item.thumbnails?.[0]?.url || item.thumbnail?.[0]?.url || ""
                const duration = item.duration?.text || "0:00"

                items.push({
                  id: videoId,
                  title,
                  artist,
                  thumbnail,
                  duration,
                  channelTitle: artist,
                })
              }
            } catch (itemError) {
              console.error("[v0] Error processing item:", itemError)
              continue
            }
          }

          if (items.length > 0) {
            sections.push({ title, items })
          }
        }
      } catch (shelfError) {
        console.error("[v0] Error processing shelf:", shelfError)
        continue
      }
    }

    console.log("[v0] Processed", sections.length, "sections")
    return { sections }
  } catch (error) {
    console.error("[v0] Error getting home feed:", error)
    return { sections: [] }
  }
}

export async function searchMusic(query: string, continuation?: string): Promise<YouTubeSearchResult> {
  const innertube = await getInnertube()

  let searchResults
  if (continuation) {
    searchResults = await innertube.music.search(query, { continuation })
  } else {
    searchResults = await innertube.music.search(query)
  }

  const videos: YouTubeVideo[] = []

  for (const item of searchResults.contents || []) {
    if (item.type === "MusicResponsiveListItem") {
      const videoId = item.id
      const title = item.title?.text || "Unknown Title"
      const artist = item.artists?.[0]?.name || item.author?.name || "Unknown Artist"
      const thumbnail = item.thumbnails?.[0]?.url || ""
      const duration = item.duration?.text || "0:00"

      videos.push({
        id: videoId,
        title,
        artist,
        thumbnail,
        duration,
        channelTitle: artist,
      })
    }
  }

  return {
    videos,
    continuation: searchResults.has_continuation ? searchResults.continuation : undefined,
  }
}

export async function getAudioStream(videoId: string): Promise<{ audioUrl: string; video: YouTubeVideo } | null> {
  try {
    const innertube = await getInnertube()
    const info = await innertube.getInfo(videoId)

    const format = info.chooseFormat({ type: "audio", quality: "best" })

    if (!format.decipher) {
      return null
    }

    const audioUrl = format.decipher(innertube.session.player)

    const video: YouTubeVideo = {
      id: videoId,
      title: info.basic_info.title || "Unknown Title",
      artist: info.basic_info.author || "Unknown Artist",
      thumbnail: info.basic_info.thumbnail?.[0]?.url || "",
      duration: formatDuration(info.basic_info.duration || 0),
      channelTitle: info.basic_info.author || "Unknown Artist",
      audioUrl,
    }

    return { audioUrl, video }
  } catch (error) {
    console.error("[v0] Error getting audio stream:", error)
    return null
  }
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}
