"use client"

import { useState, useEffect, useCallback } from "react"
import { ArrowLeft, Play, MoreVertical, User, Music } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useAudioPlayer } from "@/contexts/audio-player-context"

interface Song {
  id: string
  title: string
  artist: string
  thumbnail?: string
  duration?: string
}

interface ArtistPageProps {
  params: {
    name: string
  }
}

export default function ArtistPage({ params }: ArtistPageProps) {
  const router = useRouter()
  const { playQueue } = useAudioPlayer()
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const artistName = decodeURIComponent(params.name)

  const loadSongs = useCallback(async () => {
    if (loading) return

    setLoading(true)
    setError(null)

    try {
      console.log("[v0] Loading songs for artist:", artistName)

      const response = await fetch(`/api/artist/${encodeURIComponent(artistName)}?maxResults=20`)

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      console.log("[v0] Loaded", data.songs.length, "songs for artist")
      setSongs(data.songs)
    } catch (err) {
      setError("Failed to load songs")
      console.error("Error loading artist songs:", err)
    } finally {
      setLoading(false)
    }
  }, [artistName, loading])

  useEffect(() => {
    loadSongs()
  }, [artistName])

  const handlePlaySong = (song: Song, index: number) => {
    playQueue(songs, index)
  }

  const handlePlayAll = () => {
    if (songs.length > 0) {
      playQueue(songs, 0)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Header */}
      <header className="flex items-center gap-4 p-4 bg-zinc-900">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-gray-300 hover:text-white">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-semibold text-white">{artistName}</h1>
      </header>

      <div className="px-4 pb-24">
        {/* Artist Header */}
        <div className="py-8 text-center">
          <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <User className="w-16 h-16 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">{artistName}</h2>
          <p className="text-gray-400 mb-6">Artist • {songs.length} songs</p>

          {songs.length > 0 && (
            <Button
              onClick={handlePlayAll}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-8 py-3 rounded-full"
            >
              <Play className="w-5 h-5 mr-2" />
              Play All
            </Button>
          )}
        </div>

        {/* Songs List */}
        {songs.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-yellow-400 mb-4">Songs</h3>
            {songs.map((song, index) => (
              <div
                key={`${song.id}-${index}`}
                className="flex items-center gap-4 p-3 hover:bg-zinc-800/50 rounded-lg cursor-pointer group"
                onClick={() => handlePlaySong(song, index)}
              >
                <div className="w-12 h-12 bg-zinc-700 rounded overflow-hidden flex-shrink-0">
                  {song.thumbnail ? (
                    <img
                      src={song.thumbnail || "/placeholder.svg"}
                      alt={song.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <Music className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium truncate">{song.title}</h4>
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <span>{song.artist}</span>
                    {song.duration && (
                      <>
                        <span>•</span>
                        <span>{song.duration}</span>
                      </>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white"
                >
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
            <span className="ml-3 text-gray-400">Loading songs...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-8">
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={() => loadSongs()} variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {/* Empty State */}
        {songs.length === 0 && !loading && !error && (
          <div className="text-center py-12">
            <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">No songs found</p>
            <p className="text-gray-500 text-sm">We couldn't find any songs by {artistName}</p>
          </div>
        )}
      </div>
    </div>
  )
}