import { Innertube } from "youtubei.js"

let innertubeInstance: Innertube | null = null

export async function getInnertube() {
  if (!innertubeInstance) {
    innertubeInstance = await Innertube.create()
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
