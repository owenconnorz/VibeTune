"use client"

import { useState } from "react"
import { Bell, Search, MoreVertical, Home, Compass, Library, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AudioPlayer } from "@/components/audio-player"
import { SearchModal } from "@/components/search-modal"
import { useAudioPlayer } from "@/contexts/audio-player-context"
import { useTrendingMusic, useMoodPlaylist } from "@/hooks/use-music-data"
import { SongSkeleton, PlaylistCardSkeleton, ErrorMessage } from "@/components/loading-skeleton"
import { moodPlaylists } from "@/lib/music-data"
import { useRouter } from "next/navigation"

export default function OpenTunePage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const router = useRouter()
  const { playTrack, playQueue } = useAudioPlayer()
  const {
    songs: trendingSongs,
    loading: trendingLoading,
    error: trendingError,
    refetch: refetchTrending,
  } = useTrendingMusic()
  const {
    songs: morningBoostSongs,
    loading: morningLoading,
    error: morningError,
  } = useMoodPlaylist(moodPlaylists["morning-boost"].queries)

  // Convert Song to Track format for audio player
  const convertToTrack = (song: any) => ({
    id: song.id,
    title: song.title,
    artist: song.artist,
    thumbnail: song.thumbnail,
    duration: song.duration,
  })

  const handlePlaySong = (song: any, songList: any[]) => {
    const tracks = songList.map(convertToTrack)
    const startIndex = songList.findIndex((s) => s.id === song.id)
    playQueue(tracks, startIndex)
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">♪</span>
          </div>
          <h1 className="text-xl font-semibold text-white">OpenTune</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white">
            <Bell className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-300 hover:text-white"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-300 hover:text-white"
            onClick={() => router.push("/settings")}
          >
            <Settings className="w-5 h-5" />
          </Button>
          <Avatar className="w-8 h-8">
            <AvatarImage src="/diverse-profile-avatars.png" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="flex gap-8 px-4 py-4 bg-zinc-800">
        <button className="text-gray-300 hover:text-white font-medium">History</button>
        <button className="text-gray-300 hover:text-white font-medium">Stats</button>
        <button className="text-gray-300 hover:text-white font-medium">Liked</button>
        <button className="text-gray-300 hover:text-white font-medium">Downloaded</button>
      </nav>

      <div className="px-4 pb-24">
        {/* Quick picks - Real Trending Music */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-yellow-400 mb-6">Quick picks</h2>

          {trendingError ? (
            <ErrorMessage message={trendingError} onRetry={refetchTrending} />
          ) : (
            <div className="space-y-4">
              {trendingLoading
                ? Array.from({ length: 4 }).map((_, i) => <SongSkeleton key={i} />)
                : trendingSongs.slice(0, 6).map((song) => (
                    <div
                      key={song.id}
                      className="flex items-center gap-4 cursor-pointer hover:bg-zinc-800/50 rounded-lg p-2 -m-2 transition-colors"
                      onClick={() => handlePlaySong(song, trendingSongs)}
                    >
                      <img
                        src={song.thumbnail || "/placeholder.svg?height=60&width=60"}
                        alt={`${song.title} thumbnail`}
                        className="w-15 h-15 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white truncate">{song.title}</h3>
                        <p className="text-gray-400 truncate">{song.artist}</p>
                      </div>
                      <div className="text-xs text-gray-500 mr-2">{song.duration}</div>
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                        <MoreVertical className="w-5 h-5" />
                      </Button>
                    </div>
                  ))}
            </div>
          )}
        </section>

        {/* Morning Mood Boost - Real Playlist Data */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-yellow-400 mb-6">Morning Mood Boost</h2>

          {morningError ? (
            <ErrorMessage message={morningError} />
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {morningLoading ? (
                Array.from({ length: 3 }).map((_, i) => <PlaylistCardSkeleton key={i} />)
              ) : (
                <>
                  {/* Energetic Morning Hits */}
                  <div
                    className="flex-shrink-0 w-48 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() =>
                      morningBoostSongs.length > 0 && handlePlaySong(morningBoostSongs[0], morningBoostSongs)
                    }
                  >
                    <div className="relative rounded-lg overflow-hidden mb-3">
                      <img
                        src={
                          morningBoostSongs[0]?.thumbnail ||
                          "/placeholder.svg?height=192&width=192&query=morning energy music" ||
                          "/placeholder.svg" ||
                          "/placeholder.svg"
                        }
                        alt="Morning Energy"
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-4 left-4">
                        <h3 className="text-white font-bold text-lg">Morning</h3>
                        <h4 className="text-yellow-400 font-bold text-lg">Energy</h4>
                      </div>
                    </div>
                    <h3 className="text-white font-semibold truncate">Morning Energy</h3>
                    <p className="text-gray-400 text-sm truncate">
                      {morningBoostSongs
                        .slice(0, 2)
                        .map((s) => s.artist)
                        .join(", ")}
                      ...
                    </p>
                  </div>

                  {/* Feel-Good Hits */}
                  <div
                    className="flex-shrink-0 w-48 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() =>
                      morningBoostSongs.length > 3 && handlePlaySong(morningBoostSongs[3], morningBoostSongs)
                    }
                  >
                    <div className="relative rounded-lg overflow-hidden mb-3">
                      <img
                        src={
                          morningBoostSongs[3]?.thumbnail ||
                          "/placeholder.svg?height=192&width=192&query=feel good pop music" ||
                          "/placeholder.svg" ||
                          "/placeholder.svg"
                        }
                        alt="Feel-Good Pop"
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-4 left-4">
                        <h3 className="text-white font-bold text-lg">Feel-Good</h3>
                        <h4 className="text-yellow-400 font-bold text-lg">Pop & Rock</h4>
                      </div>
                    </div>
                    <h3 className="text-white font-semibold truncate">Feel-Good Pop & Rock</h3>
                    <p className="text-gray-400 text-sm truncate">
                      {morningBoostSongs
                        .slice(3, 5)
                        .map((s) => s.artist)
                        .join(", ")}
                      ...
                    </p>
                  </div>

                  {/* Upbeat Classics */}
                  <div
                    className="flex-shrink-0 w-48 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() =>
                      morningBoostSongs.length > 6 && handlePlaySong(morningBoostSongs[6], morningBoostSongs)
                    }
                  >
                    <div className="relative rounded-lg overflow-hidden mb-3">
                      <img
                        src={
                          morningBoostSongs[6]?.thumbnail ||
                          "/placeholder.svg?height=192&width=192&query=upbeat classic hits" ||
                          "/placeholder.svg" ||
                          "/placeholder.svg"
                        }
                        alt="Upbeat Classics"
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-4 left-4">
                        <h3 className="text-white font-bold text-lg">Upbeat</h3>
                        <h4 className="text-white font-bold text-lg">Classics</h4>
                      </div>
                    </div>
                    <h3 className="text-white font-semibold truncate">Upbeat Classics</h3>
                    <p className="text-gray-400 text-sm truncate">
                      {morningBoostSongs
                        .slice(6, 8)
                        .map((s) => s.artist)
                        .join(", ")}
                      ...
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </section>
      </div>

      <AudioPlayer />

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-800 border-t border-zinc-700">
        <div className="flex items-center justify-around py-2">
          <div className="flex flex-col items-center py-2 px-4">
            <div className="bg-yellow-600 rounded-full p-2 mb-1">
              <Home className="w-5 h-5 text-black" />
            </div>
            <span className="text-xs text-white font-medium">Home</span>
          </div>
          <div className="flex flex-col items-center py-2 px-4">
            <Compass className="w-6 h-6 text-gray-400 mb-1" />
            <span className="text-xs text-gray-400">Explore</span>
          </div>
          <div className="flex flex-col items-center py-2 px-4">
            <Library className="w-6 h-6 text-gray-400 mb-1" />
            <span className="text-xs text-gray-400">Library</span>
          </div>
        </div>
      </nav>
    </div>
  )
}
