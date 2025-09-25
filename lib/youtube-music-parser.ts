// YouTube Music response parser based on SimpMusic's data extraction
export interface ParsedTrack {
  id: string
  title: string
  artist: string
  thumbnail: string
  duration: string
  type: "song" | "video"
}

export interface ParsedArtist {
  id: string
  name: string
  thumbnail: string
  subscribers?: string
  type: "artist"
}

export interface ParsedAlbum {
  id: string
  title: string
  artist: string
  thumbnail: string
  year?: string
  type: "album"
}

export interface ParsedPlaylist {
  id: string
  title: string
  author: string
  thumbnail: string
  trackCount?: string
  type: "playlist"
}

export class YouTubeMusicParser {
  static parseSearchResults(data: any): {
    songs: ParsedTrack[]
    videos: ParsedTrack[]
    artists: ParsedArtist[]
    albums: ParsedAlbum[]
    playlists: ParsedPlaylist[]
  } {
    const results = {
      songs: [] as ParsedTrack[],
      videos: [] as ParsedTrack[],
      artists: [] as ParsedArtist[],
      albums: [] as ParsedAlbum[],
      playlists: [] as ParsedPlaylist[],
    }

    try {
      const contents =
        data?.contents?.tabbedSearchResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents

      if (!contents) {
        console.log("[v0] YouTube Music Parser: No search contents found")
        return results
      }

      for (const section of contents) {
        const items = section?.musicShelfRenderer?.contents || []

        for (const item of items) {
          const renderer = item?.musicResponsiveListItemRenderer
          if (!renderer) continue

          try {
            const parsed = this.parseListItem(renderer)
            if (parsed) {
              switch (parsed.type) {
                case "song":
                  results.songs.push(parsed as ParsedTrack)
                  break
                case "video":
                  results.videos.push(parsed as ParsedTrack)
                  break
                case "artist":
                  results.artists.push(parsed as ParsedArtist)
                  break
                case "album":
                  results.albums.push(parsed as ParsedAlbum)
                  break
                case "playlist":
                  results.playlists.push(parsed as ParsedPlaylist)
                  break
              }
            }
          } catch (error) {
            console.error("[v0] YouTube Music Parser: Error parsing item:", error)
          }
        }
      }

      console.log("[v0] YouTube Music Parser: Parsed results:", {
        songs: results.songs.length,
        videos: results.videos.length,
        artists: results.artists.length,
        albums: results.albums.length,
        playlists: results.playlists.length,
      })
    } catch (error) {
      console.error("[v0] YouTube Music Parser: Error parsing search results:", error)
    }

    return results
  }

  private static parseListItem(renderer: any): ParsedTrack | ParsedArtist | ParsedAlbum | ParsedPlaylist | null {
    try {
      const flexColumns = renderer?.flexColumns || []
      const thumbnail = this.extractThumbnail(renderer)
      const navigationEndpoint =
        renderer?.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint

      // Extract basic info
      const title = this.extractText(flexColumns[0])
      const subtitle = this.extractText(flexColumns[1])

      if (!title) return null

      // Determine type based on navigation endpoint and content
      const videoId = navigationEndpoint?.videoPlaybackContext?.videoId
      const browseId = navigationEndpoint?.browseEndpoint?.browseId
      const playlistId = navigationEndpoint?.watchPlaylistEndpoint?.playlistId

      // Parse as song/video
      if (videoId) {
        const duration = this.extractDuration(flexColumns)
        const artist = this.extractArtist(subtitle)

        return {
          id: videoId,
          title,
          artist: artist || "Unknown Artist",
          thumbnail,
          duration: duration || "0:00",
          type: subtitle?.includes("•") ? "song" : "video",
        }
      }

      // Parse as artist
      if (browseId?.startsWith("UC") || browseId?.startsWith("MPLA")) {
        return {
          id: browseId,
          name: title,
          thumbnail,
          subscribers: this.extractSubscribers(subtitle),
          type: "artist",
        }
      }

      // Parse as album
      if (browseId?.startsWith("MPREb_")) {
        const artist = this.extractArtist(subtitle)
        const year = this.extractYear(subtitle)

        return {
          id: browseId,
          title,
          artist: artist || "Unknown Artist",
          thumbnail,
          year,
          type: "album",
        }
      }

      // Parse as playlist
      if (playlistId || browseId?.startsWith("VL")) {
        const author = this.extractArtist(subtitle)
        const trackCount = this.extractTrackCount(subtitle)

        return {
          id: playlistId || browseId,
          title,
          author: author || "Unknown",
          thumbnail,
          trackCount,
          type: "playlist",
        }
      }

      return null
    } catch (error) {
      console.error("[v0] YouTube Music Parser: Error parsing list item:", error)
      return null
    }
  }

  private static extractText(column: any): string {
    try {
      return column?.text?.runs?.[0]?.text || column?.text?.simpleText || ""
    } catch {
      return ""
    }
  }

  private static extractThumbnail(renderer: any): string {
    try {
      const thumbnails = renderer?.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails
      if (thumbnails && thumbnails.length > 0) {
        // Get highest quality thumbnail
        return thumbnails[thumbnails.length - 1]?.url || ""
      }
      return ""
    } catch {
      return ""
    }
  }

  private static extractDuration(flexColumns: any[]): string {
    try {
      for (const column of flexColumns) {
        const text = this.extractText(column)
        if (text.match(/^\d+:\d+$/)) {
          return text
        }
      }
      return "0:00"
    } catch {
      return "0:00"
    }
  }

  private static extractArtist(subtitle: string): string {
    try {
      // Extract artist name before first bullet point
      const parts = subtitle.split("•")
      return parts[0]?.trim() || ""
    } catch {
      return ""
    }
  }

  private static extractYear(subtitle: string): string {
    try {
      const yearMatch = subtitle.match(/\b(19|20)\d{2}\b/)
      return yearMatch?.[0] || ""
    } catch {
      return ""
    }
  }

  private static extractSubscribers(subtitle: string): string {
    try {
      const subMatch = subtitle.match(/[\d,.]+ subscribers?/i)
      return subMatch?.[0] || ""
    } catch {
      return ""
    }
  }

  private static extractTrackCount(subtitle: string): string {
    try {
      const trackMatch = subtitle.match(/(\d+) songs?/i)
      return trackMatch?.[1] || ""
    } catch {
      return ""
    }
  }

  static parseHomeFeed(data: any): {
    quickPicks: ParsedTrack[]
    newReleases: ParsedAlbum[]
    recommendations: ParsedTrack[]
    charts: ParsedTrack[]
  } {
    const results = {
      quickPicks: [] as ParsedTrack[],
      newReleases: [] as ParsedAlbum[],
      recommendations: [] as ParsedTrack[],
      charts: [] as ParsedTrack[],
    }

    try {
      const sections =
        data?.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer
          ?.contents

      if (!sections) {
        console.log("[v0] YouTube Music Parser: No home feed sections found")
        return results
      }

      for (const section of sections) {
        const shelf = section?.musicCarouselShelfRenderer
        if (!shelf) continue

        const title = shelf?.header?.musicCarouselShelfBasicHeaderRenderer?.title?.runs?.[0]?.text?.toLowerCase() || ""
        const items = shelf?.contents || []

        console.log(`[v0] YouTube Music Parser: Processing section: ${title} with ${items.length} items`)

        if (title.includes("quick picks") || title.includes("mixed for you")) {
          results.quickPicks.push(...this.parseCarouselItems(items, "song"))
        } else if (title.includes("new release") || title.includes("new album")) {
          results.newReleases.push(...this.parseCarouselItems(items, "album"))
        } else if (title.includes("recommended") || title.includes("for you")) {
          results.recommendations.push(...this.parseCarouselItems(items, "song"))
        } else if (title.includes("chart") || title.includes("trending")) {
          results.charts.push(...this.parseCarouselItems(items, "song"))
        }
      }

      console.log("[v0] YouTube Music Parser: Parsed home feed:", {
        quickPicks: results.quickPicks.length,
        newReleases: results.newReleases.length,
        recommendations: results.recommendations.length,
        charts: results.charts.length,
      })
    } catch (error) {
      console.error("[v0] YouTube Music Parser: Error parsing home feed:", error)
    }

    return results
  }

  private static parseCarouselItems(items: any[], expectedType: string): any[] {
    const results: any[] = []

    for (const item of items) {
      const renderer = item?.musicTwoRowItemRenderer || item?.musicResponsiveListItemRenderer
      if (!renderer) continue

      try {
        const parsed = this.parseCarouselItem(renderer, expectedType)
        if (parsed) {
          results.push(parsed)
        }
      } catch (error) {
        console.error("[v0] YouTube Music Parser: Error parsing carousel item:", error)
      }
    }

    return results
  }

  private static parseCarouselItem(renderer: any, expectedType: string): any {
    try {
      const title = renderer?.title?.runs?.[0]?.text || ""
      const subtitle = renderer?.subtitle?.runs?.[0]?.text || ""
      const thumbnail = this.extractThumbnail(renderer)

      const navigationEndpoint =
        renderer?.navigationEndpoint ||
        renderer?.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint
      const videoId = navigationEndpoint?.videoPlaybackContext?.videoId || navigationEndpoint?.watchEndpoint?.videoId
      const browseId = navigationEndpoint?.browseEndpoint?.browseId

      if (!title) return null

      if (expectedType === "song" && videoId) {
        return {
          id: videoId,
          title,
          artist: subtitle || "Unknown Artist",
          thumbnail,
          duration: "0:00", // Duration not available in carousel
          type: "song",
        }
      }

      if (expectedType === "album" && browseId) {
        return {
          id: browseId,
          title,
          artist: subtitle || "Unknown Artist",
          thumbnail,
          type: "album",
        }
      }

      return null
    } catch (error) {
      console.error("[v0] YouTube Music Parser: Error parsing carousel item:", error)
      return null
    }
  }
}
