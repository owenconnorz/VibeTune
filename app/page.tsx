"use client"

import { useState, useEffect } from "react"
import { Bell, Search, MoreVertical, Home, Compass, Library, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AudioPlayer } from "@/components/audio-player"
import { SearchModal } from "@/components/search-modal"
import { useAudioPlayer } from "@/contexts/audio-player-context"
import { useAuth } from "@/contexts/auth-context"
import { useSync } from "@/contexts/sync-context"
import { AddToPlaylistDialog } from "@/components/add-to-playlist-dialog"
import { DownloadButton } from "@/components/download-button"
import { DownloadStatusBadge } from "@/components/download-status-badge"
import { useTrendingMusic, useMoodPlaylist } from "@/hooks/use-music-data"
import { SongSkeleton, PlaylistCardSkeleton, ErrorMessage } from "@/components/loading-skeleton"
import { moodPlaylists } from "@/lib/music-data"
import { useRouter } from "next/navigation"
import { musicCache } from "@/lib/music-cache"

export default function OpenTunePage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const router = useRouter()
  const { user } = useAuth()
  const { syncData } = useSync()
  const { playTrack, playQueue, state } = useAudioPlayer() // Added state to access current track
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

  useEffect(() => {
    console.log("[v0] 🎵 CACHE CLEAR: Clearing mood playlist cache to force fresh YouTube Data API v3 calls")
    const cacheKey = `mood_playlist_${moodPlaylists["morning-boost"].queries.join("_").toLowerCase().replace(/\s+/g, "_")}`
    musicCache.remove(cacheKey)
  }, [])

  // Convert Song to Track format for audio player
  const convertToTrack = (song: any) => ({
    id: song.id,
    title: song.title,
    artist: song.artist || song.channelTitle,
    thumbnail: song.thumbnail,
    duration: song.duration,
  })

  console.log("[v0] 🎵 YOUTUBE DATA API v3 VALIDATION - Homepage data state:", {
    trendingSongs: trendingSongs.length,
    trendingLoading,
    trendingError: trendingError ? `ERROR: ${trendingError}` : null,
    morningBoostSongs: morningBoostSongs.length,
    morningLoading,
    morningError: morningError ? `ERROR: ${morningError}` : null,
    timestamp: new Date().toISOString(),
  })

  if (trendingSongs.length > 0) {
    console.log("[v0] 🎵 YOUTUBE DATA API v3 TRENDING SAMPLE:", {
      firstSong: {
        id: trendingSongs[0].id,
        title: trendingSongs[0].title,
        artist: trendingSongs[0].artist || trendingSongs[0].channelTitle,
        thumbnail: trendingSongs[0].thumbnail ? "✅ Has thumbnail" : "❌ No thumbnail",
        duration: trendingSongs[0].duration,
      },
      totalSongs: trendingSongs.length,
      apiSource: "YouTube Data API v3",
    })
  }

  if (morningBoostSongs.length > 0) {
    console.log("[v0] 🎵 YOUTUBE DATA API v3 MORNING BOOST SAMPLE:", {
      firstSong: {
        id: morningBoostSongs[0].id,
        title: morningBoostSongs[0].title,
        artist: morningBoostSongs[0].artist || morningBoostSongs[0].channelTitle,
        thumbnail: morningBoostSongs[0].thumbnail ? "✅ Has thumbnail" : "❌ No thumbnail",
        duration: morningBoostSongs[0].duration,
      },
      totalSongs: morningBoostSongs.length,
      apiSource: "YouTube Data API v3",
    })
  }

  console.log("[v0] Current track:", state.currentTrack?.title || "None")

  useEffect(() => {
    if (trendingSongs.length > 0 && !state.currentTrack && !trendingLoading) {
      console.log("[v0] 🎵 YOUTUBE DATA API v3 VALIDATION: Auto-setting first trending song as current track")
      console.log("[v0] 🎵 Selected track for theme:", {
        title: trendingSongs[0].title,
        artist: trendingSongs[0].artist || trendingSongs[0].channelTitle,
        thumbnail: trendingSongs[0].thumbnail,
        source: "YouTube Data API v3",
      })
      const firstTrack = convertToTrack(trendingSongs[0])
      playTrack(firstTrack)
    }
  }, [trendingSongs, state.currentTrack, trendingLoading])

  const handlePlaySong = (song: any, songList: any[]) => {
    console.log(
      "[v0] 🎵 YOUTUBE DATA API v3 PLAYBACK: Playing song:",
      song.title,
      "from list of",
      songList.length,
      "songs",
    )
    console.log("[v0] 🎵 Song details:", {
      id: song.id,
      title: song.title,
      artist: song.artist || song.channelTitle,
      thumbnail: song.thumbnail ? "✅ Has thumbnail" : "❌ No thumbnail",
      duration: song.duration,
      source: "YouTube Data API v3",
    })
    const tracks = songList.map(convertToTrack)
    const startIndex = songList.findIndex((s) => s.id === song.id)
    console.log("[v0] 🎵 Starting playback at index:", startIndex)
    playQueue(tracks, startIndex)
  }

  useEffect(() => {
    const logApiPerformance = () => {
      console.log("[v0] 🎵 YOUTUBE DATA API v3 PERFORMANCE METRICS:", {
        trendingLoaded: !trendingLoading && trendingSongs.length > 0,
        morningBoostLoaded: !morningLoading && morningBoostSongs.length > 0,
        totalSongsLoaded: trendingSongs.length + morningBoostSongs.length,
        hasErrors: !!(trendingError || morningError),
        loadingState: {
          trending: trendingLoading ? "Loading..." : "Complete",
          morningBoost: morningLoading ? "Loading..." : "Complete",
        },
        timestamp: new Date().toISOString(),
      })
    }

    if (!trendingLoading && !morningLoading) {
      logApiPerformance()
    }
  }, [trendingLoading, morningLoading, trendingSongs.length, morningBoostSongs.length, trendingError, morningError])

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
            <AvatarImage src={user?.picture || "/diverse-profile-avatars.png"} />
            <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="flex gap-8 px-4 py-4 bg-zinc-800">
        <button className="text-gray-300 hover:text-white font-medium">History</button>
        <button className="text-gray-300 hover:text-white font-medium">Stats</button>
        <button className="text-gray-300 hover:text-white font-medium relative">
          Liked
          {user && syncData.likedSongs.length > 0 && (
            <span className="absolute -top-1 -right-2 bg-yellow-600 text-black text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {syncData.likedSongs.length > 99 ? "99+" : syncData.likedSongs.length}
            </span>
          )}
        </button>
        <button className="text-gray-300 hover:text-white font-medium">Downloaded</button>
      </nav>

      <div className="px-4 pb-24">
        {/* User's Synced Content */}
        {user && (syncData.playlists.length > 0 || syncData.likedSongs.length > 0) && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-yellow-400">Your Music</h2>
              <Button
                variant="outline"
                onClick={() => router.push("/library")}
                className="border-zinc-600 text-gray-300 hover:bg-zinc-700 bg-transparent"
              >
                View All
              </Button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {syncData.playlists.slice(0, 3).map((playlist) => (
                <div
                  key={playlist.id}
                  className="flex-shrink-0 w-48 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => router.push("/library")}
                >
                  <div className="relative rounded-lg overflow-hidden mb-3">
                    <img
                      src={playlist.thumbnail || "/placeholder.svg?height=192&width=192&query=music playlist"}
                      alt={playlist.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <h3 className="text-white font-bold text-lg truncate">{playlist.title}</h3>
                      <p className="text-yellow-400 font-bold text-sm">{playlist.videoCount} songs</p>
                    </div>
                  </div>
                </div>
              ))}
              {syncData.likedSongs.length > 0 && (
                <div
                  className="flex-shrink-0 w-48 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => router.push("/library")}
                >
                  <div className="relative rounded-lg overflow-hidden mb-3 bg-gradient-to-br from-red-500 to-pink-600">
                    <div className="w-full h-48 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                          <span className="text-3xl">❤️</span>
                        </div>
                        <h3 className="text-white font-bold text-lg">Liked Songs</h3>
                        <p className="text-white/80 font-bold text-sm">{syncData.likedSongs.length} songs</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Quick picks - Real Trending Music */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-yellow-400">Quick picks</h2>
            <div className="flex items-center gap-2">
              {!trendingLoading && trendingSongs.length > 0 && (
                <AddToPlaylistDialog songs={trendingSongs} isAddAll={true} />
              )}
            </div>
          </div>

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
                        <DownloadStatusBadge songId={song.id} className="mt-1" />
                      </div>
                      <div className="text-xs text-gray-500 mr-2">{song.duration}</div>
                      <div className="flex items-center gap-1">
                        <DownloadButton song={song} showProgress={true} />
                        <AddToPlaylistDialog
                          songs={[song]}
                          trigger={
                            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                              <MoreVertical className="w-5 h-5" />
                            </Button>
                          }
                        />
                      </div>
                    </div>
                  ))}
            </div>
          )}
        </section>

        {/* Morning Mood Boost - Real Playlist Data */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-yellow-400">Morning Mood Boost</h2>
            <div className="flex items-center gap-2">
              {!morningLoading && morningBoostSongs.length > 0 && (
                <AddToPlaylistDialog songs={morningBoostSongs} isAddAll={true} />
              )}
            </div>
          </div>

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
          <div className="flex flex-col items-center py-2 px-4 cursor-pointer" onClick={() => router.push("/library")}>
            <div className="relative">
              <Library className="w-6 h-6 text-gray-400 mb-1" />
              {user && (syncData.playlists.length > 0 || syncData.likedSongs.length > 0) && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full"></div>
              )}
            </div>
            <span className="text-xs text-gray-400">Library</span>
          </div>
        </div>
      </nav>
    </div>
  )
}
