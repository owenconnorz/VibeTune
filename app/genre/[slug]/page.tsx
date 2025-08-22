"use client"

import { useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAudioPlayer } from "@/contexts/audio-player-context"
import { SongMenu } from "@/components/song-menu"
import { DownloadedIcon } from "@/components/downloaded-icon"
import { OptimizedImage } from "@/components/optimized-image"
import { SongSkeleton, ErrorMessage } from "@/components/loading-skeleton"
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll"
import { searchMusic } from "@/lib/music-data"
import { genreCache } from "@/lib/genre-cache"

const genreQueries: Record<string, string[]> = {
  "hip-hop-classics": [
    "Notorious BIG greatest hits",
    "Tupac classic songs",
    "Nas hip hop classics",
    "90s hip hop legends",
  ],
  "r-b-party-starters": ["Destiny's Child hits", "Beyonce party songs", "Usher dance tracks", "R&B party classics"],
  "classic-pop-party": ["Queen greatest hits", "ABBA party songs", "Blondie classic hits", "80s pop party music"],
}

export default function GenrePage() {
  const params = useParams()
  const router = useRouter()
  const { playTrack, playQueue } = useAudioPlayer()
  const slug = params.slug as string

  const queries = genreQueries[slug] || [`${slug.replace(/-/g, " ")} music`]

  const {
    items: songs,
    loading,
    hasMore,
    error,
  } = useInfiniteScroll({
    fetchMore: async (page: number) => {
      console.log("[v0] Fetching genre songs page:", page, "for:", slug)

      if (page === 1) {
        const cached = genreCache.get(slug)
        if (cached && cached.songs.length > 0) {
          console.log("[v0] Using cached genre data:", slug, cached.songs.length, "songs")
          return {
            items: cached.songs.slice(0, 8), // Return first page from cache
            hasMore: cached.songs.length > 8 || cached.pages > 1,
          }
        }
      }

      // If page 2+ and we have cached data, use it
      if (page > 1) {
        const cached = genreCache.get(slug)
        if (cached && cached.songs.length >= page * 8) {
          const startIndex = (page - 1) * 8
          const endIndex = page * 8
          console.log("[v0] Using cached data for page", page)
          return {
            items: cached.songs.slice(startIndex, endIndex),
            hasMore: cached.songs.length > endIndex,
          }
        }
      }

      // Fallback to API call
      const queryIndex = (page - 1) % queries.length
      const query = queries[queryIndex]

      const results = await searchMusic(query)

      // Cache the results
      if (page === 1) {
        genreCache.set(slug, results, 1)
      } else {
        genreCache.append(slug, results, page)
      }

      return {
        items: results,
        hasMore: results.length >= 8 && page < 5, // Limit to 5 pages max
      }
    },
    threshold: 600,
  })

  const categoryTitle = useMemo(() => {
    return slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }, [slug])

  const convertToTrack = (song: any) => ({
    id: song.id,
    title: song.title,
    artist: song.artist || song.channelTitle,
    thumbnail: song.thumbnail,
    duration: song.duration,
  })

  const handlePlaySong = (song: any, songList: any[]) => {
    const tracks = songList.map(convertToTrack)
    const startIndex = songList.findIndex((s) => s.id === song.id)
    playQueue(tracks, startIndex)
  }

  const handlePlayAll = () => {
    if (songs.length > 0) {
      const tracks = songs.map(convertToTrack)
      playQueue(tracks, 0)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Header */}
      <header className="flex items-center gap-4 px-4 py-4 bg-zinc-800">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-gray-300 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-white">{categoryTitle}</h1>
      </header>

      <div className="px-4 pb-20">
        {/* Category Header */}
        <div className="py-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">♪</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">{categoryTitle}</h2>
              <p className="text-gray-400">{songs.length} songs</p>
            </div>
          </div>

          {songs.length > 0 && (
            <Button onClick={handlePlayAll} className="bg-yellow-600 hover:bg-yellow-700 text-black font-semibold px-8">
              <Play className="w-4 h-4 mr-2" />
              Play All
            </Button>
          )}
        </div>

        {/* Songs List */}
        {error ? (
          <ErrorMessage message={error} />
        ) : (
          <div className="space-y-2">
            {songs.map((song, index) => (
              <div
                key={`${song.id}-${index}`}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-800/50 cursor-pointer transition-colors"
                onClick={() => handlePlaySong(song, songs)}
              >
                <div className="w-8 text-gray-400 text-sm font-medium">{index + 1}</div>
                <OptimizedImage
                  src={song.thumbnail}
                  alt={`${song.title} thumbnail`}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium truncate">{song.title}</h3>
                  <p className="text-gray-400 text-sm truncate">{song.artist}</p>
                </div>
                <div className="text-gray-400 text-sm">{song.duration}</div>
                <div className="flex items-center gap-2">
                  <DownloadedIcon songId={song.id} />
                  <SongMenu song={song} />
                </div>
              </div>
            ))}

            {loading && songs.length > 0 && (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400"></div>
                <span className="ml-3 text-gray-400">Loading more songs...</span>
              </div>
            )}

            {!hasMore && songs.length > 0 && !loading && (
              <div className="text-center py-6">
                <p className="text-gray-400">You've reached the end • {songs.length} songs total</p>
              </div>
            )}

            {loading && songs.length === 0 && Array.from({ length: 8 }).map((_, i) => <SongSkeleton key={i} />)}
          </div>
        )}
      </div>
    </div>
  )
}
