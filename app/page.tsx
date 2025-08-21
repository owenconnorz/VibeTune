"use client"

import React from "react"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Search, Home, Compass, Library, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AudioPlayer } from "@/components/audio-player"
import { useAudioPlayer } from "@/contexts/audio-player-context"
import { useAuth } from "@/contexts/auth-context"
import { useSync } from "@/contexts/sync-context"
import { SongMenu } from "@/components/song-menu"
import { DownloadedIcon } from "@/components/downloaded-icon"
import { useTrendingMusic, useMoodPlaylist } from "@/hooks/use-music-data"
import { SongSkeleton, PlaylistCardSkeleton, ErrorMessage } from "@/components/loading-skeleton"
import { useRouter } from "next/navigation"
import { OptimizedImage } from "@/components/optimized-image"

const moodPlaylists = {
  "mixed-for-you": {
    queries: ["mixed for you playlist 2024", "personalized music mix", "discover weekly hits", "your music taste mix"],
  },
}

const MemoizedSongItem = React.memo(({ song, onPlay, trendingSongs }: any) => (
  <div
    className="flex items-center gap-4 cursor-pointer hover:bg-zinc-800/50 rounded-lg p-2 -m-2 transition-colors"
    onClick={() => onPlay(song, trendingSongs)}
  >
    <OptimizedImage
      src={song.thumbnail}
      alt={`${song.title} thumbnail`}
      width={60}
      height={60}
      className="w-15 h-15 rounded-lg object-cover"
    />
    <div className="flex-1 min-w-0">
      <h3 className="text-lg font-semibold text-white truncate">{song.title}</h3>
      <p className="text-gray-400 truncate">{song.artist}</p>
    </div>
    <div className="text-xs text-gray-500 mr-2">{song.duration}</div>
    <div className="flex items-center gap-1">
      <DownloadedIcon songId={song.id} className="mr-1" />
      <SongMenu song={song} />
    </div>
  </div>
))

const MemoizedPlaylistCard = React.memo(({ playlist, onClick }: any) => (
  <div className="flex-shrink-0 w-48 cursor-pointer hover:opacity-80 transition-opacity" onClick={onClick}>
    <div className="relative rounded-lg overflow-hidden mb-3">
      <OptimizedImage
        src={playlist.thumbnail}
        alt={playlist.title}
        width={192}
        height={192}
        className="w-full h-48 object-cover"
        fallback="/music-playlist-concept.png"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <div className="absolute bottom-4 left-4">
        <h3 className="text-white font-bold text-lg truncate">{playlist.title}</h3>
        <p className="text-yellow-400 font-bold text-sm">{playlist.videoCount} songs</p>
      </div>
    </div>
  </div>
))

export default function VibeTunePage() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [profileSettings, setProfileSettings] = useState({
    useCustomPicture: false,
    customPictureUrl: null as string | null,
  })

  const router = useRouter()
  const { user } = useAuth()
  const { syncData } = useSync()
  const { playTrack, playQueue, state } = useAudioPlayer()
  const {
    songs: trendingSongs,
    loading: trendingLoading,
    error: trendingError,
    refetch: refetchTrending,
  } = useTrendingMusic()
  const {
    songs: mixedForYouSongs,
    loading: mixedLoading,
    error: mixedError,
  } = useMoodPlaylist(moodPlaylists["mixed-for-you"].queries)

  const convertToTrack = useCallback(
    (song: any) => ({
      id: song.id,
      title: song.title,
      artist: song.artist || song.channelTitle,
      thumbnail: song.thumbnail,
      duration: song.duration,
    }),
    [],
  )

  const safeTrendingSongs = useMemo(() => (Array.isArray(trendingSongs) ? trendingSongs : []), [trendingSongs])
  const safeMixedForYouSongs = useMemo(
    () => (Array.isArray(mixedForYouSongs) ? mixedForYouSongs : []),
    [mixedForYouSongs],
  )

  useEffect(() => {
    if (safeTrendingSongs.length > 0 && !state.currentTrack && !trendingLoading) {
      const firstTrack = convertToTrack(safeTrendingSongs[0])
      playTrack(firstTrack)
    }
  }, [safeTrendingSongs, state.currentTrack, trendingLoading, convertToTrack, playTrack])

  useEffect(() => {
    try {
      const saved = localStorage.getItem("vibetuneProfileSettings")
      if (saved) {
        setProfileSettings(JSON.parse(saved))
      }
    } catch (error) {
      console.error("Failed to load profile settings:", error)
    }
  }, [])

  const handlePlaySong = useCallback(
    (song: any, songList: any[]) => {
      const tracks = songList.map(convertToTrack)
      const startIndex = songList.findIndex((s) => s.id === song.id)
      playQueue(tracks, startIndex)
    },
    [convertToTrack, playQueue],
  )

  const handleSearchClick = useCallback(() => router.push("/search"), [router])
  const handleSettingsClick = useCallback(() => router.push("/settings"), [router])
  const handleLibraryClick = useCallback(() => router.push("/library"), [router])
  const handleExploreClick = useCallback(() => router.push("/explore"), [router])

  const userContent = useMemo(() => {
    if (!user || (syncData.playlists.length === 0 && syncData.likedSongs.length === 0)) {
      return null
    }

    return (
      <section className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-yellow-400">Your Music</h2>
          <Button
            variant="outline"
            onClick={handleLibraryClick}
            className="border-zinc-600 text-gray-300 hover:bg-zinc-700 bg-transparent"
          >
            View All
          </Button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {syncData.playlists.slice(0, 3).map((playlist) => (
            <MemoizedPlaylistCard key={playlist.id} playlist={playlist} onClick={handleLibraryClick} />
          ))}
          {syncData.likedSongs.length > 0 && (
            <div
              className="flex-shrink-0 w-48 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleLibraryClick}
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
    )
  }, [user, syncData.playlists, syncData.likedSongs, handleLibraryClick])

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-purple-500 rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-xs">♪</span>
          </div>
          <h1 className="text-lg font-semibold text-white">VibeTune</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-300 hover:text-white w-8 h-8"
            onClick={handleSearchClick}
          >
            <Search className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-300 hover:text-white w-8 h-8"
            onClick={handleSettingsClick}
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Avatar className="w-7 h-7">
            <AvatarImage
              src={
                profileSettings.useCustomPicture && profileSettings.customPictureUrl
                  ? profileSettings.customPictureUrl
                  : user?.picture || "/diverse-group-making-music.png"
              }
            />
            <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="flex gap-6 px-4 py-2 bg-zinc-800 border-b border-zinc-700">
        <button className="text-gray-300 hover:text-white font-medium text-sm">History</button>
        <button className="text-gray-300 hover:text-white font-medium text-sm">Stats</button>
        <button className="text-gray-300 hover:text-white font-medium text-sm relative">
          Liked
          {user && syncData.likedSongs.length > 0 && (
            <span className="absolute -top-1 -right-2 bg-yellow-600 text-black text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
              {syncData.likedSongs.length > 99 ? "99+" : syncData.likedSongs.length}
            </span>
          )}
        </button>
        <button className="text-gray-300 hover:text-white font-medium text-sm">Downloaded</button>
      </nav>

      <div className="px-4 pb-20">
        {/* User's Synced Content */}
        {userContent}

        {/* Quick Picks - Individual Songs */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-yellow-400">Quick Picks</h2>
          </div>

          {trendingError ? (
            <ErrorMessage message={trendingError} onRetry={refetchTrending} />
          ) : (
            <div className="space-y-4">
              {trendingLoading
                ? Array.from({ length: 4 }).map((_, i) => <SongSkeleton key={i} />)
                : safeTrendingSongs
                    .slice(0, 6)
                    .map((song) => (
                      <MemoizedSongItem
                        key={song.id}
                        song={song}
                        onPlay={handlePlaySong}
                        trendingSongs={safeTrendingSongs}
                      />
                    ))}
            </div>
          )}
        </section>

        {/* Mixed for You - Personalized Playlists */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-yellow-400">Mixed for You</h2>
          </div>

          {mixedError ? (
            <ErrorMessage message={mixedError} />
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {mixedLoading ? (
                Array.from({ length: 3 }).map((_, i) => <PlaylistCardSkeleton key={i} />)
              ) : (
                <>
                  <div
                    className="flex-shrink-0 w-48 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => router.push("/library/your-mix")}
                  >
                    <div className="relative rounded-lg overflow-hidden mb-3">
                      <OptimizedImage
                        src={safeMixedForYouSongs[0]?.thumbnail}
                        alt="Your Mix"
                        width={192}
                        height={192}
                        className="w-full h-48 object-cover"
                        fallback="/placeholder.svg?height=192&width=192&text=Your%20Mix&bg=6366f1&color=white"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-4 left-4">
                        <h3 className="text-white font-bold text-lg">Your</h3>
                        <h4 className="text-yellow-400 font-bold text-lg">Mix</h4>
                      </div>
                    </div>
                    <h3 className="text-white font-semibold truncate">Your Mix</h3>
                    <p className="text-gray-400 text-sm truncate">
                      {safeMixedForYouSongs.length > 0
                        ? safeMixedForYouSongs
                            .slice(0, 2)
                            .map((s) => s.artist)
                            .join(", ") + "..."
                        : "Personalized for you"}
                    </p>
                  </div>

                  <div
                    className="flex-shrink-0 w-48 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => router.push("/library/discover-mix")}
                  >
                    <div className="relative rounded-lg overflow-hidden mb-3">
                      <OptimizedImage
                        src={safeMixedForYouSongs[3]?.thumbnail}
                        alt="Discover Mix"
                        width={192}
                        height={192}
                        className="w-full h-48 object-cover"
                        fallback="/placeholder.svg?height=192&width=192&text=Discover%20Mix&bg=10b981&color=white"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-4 left-4">
                        <h3 className="text-white font-bold text-lg">Discover</h3>
                        <h4 className="text-yellow-400 font-bold text-lg">Mix</h4>
                      </div>
                    </div>
                    <h3 className="text-white font-semibold truncate">Discover Mix</h3>
                    <p className="text-gray-400 text-sm truncate">
                      {safeMixedForYouSongs.length > 3
                        ? safeMixedForYouSongs
                            .slice(3, 5)
                            .map((s) => s.artist)
                            .join(", ") + "..."
                        : "New discoveries"}
                    </p>
                  </div>

                  <div
                    className="flex-shrink-0 w-48 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => router.push("/library/new-release-mix")}
                  >
                    <div className="relative rounded-lg overflow-hidden mb-3">
                      <OptimizedImage
                        src={safeMixedForYouSongs[6]?.thumbnail}
                        alt="New Release Mix"
                        width={192}
                        height={192}
                        className="w-full h-48 object-cover"
                        fallback="/placeholder.svg?height=192&width=192&text=New%20Release&bg=f59e0b&color=white"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-4 left-4">
                        <h3 className="text-white font-bold text-lg">New Release</h3>
                        <h4 className="text-yellow-400 font-bold text-lg">Mix</h4>
                      </div>
                    </div>
                    <h3 className="text-white font-semibold truncate">New Release Mix</h3>
                    <p className="text-gray-400 text-sm truncate">
                      {safeMixedForYouSongs.length > 6
                        ? safeMixedForYouSongs
                            .slice(6, 8)
                            .map((s) => s.artist)
                            .join(", ") + "..."
                        : "Latest releases"}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </section>
      </div>

      <AudioPlayer />

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-800 border-t border-zinc-700">
        <div className="flex items-center justify-around py-1">
          <div className="flex flex-col items-center py-1 px-3">
            <div className="bg-yellow-600 rounded-full p-1.5 mb-0.5">
              <Home className="w-4 h-4 text-black" />
            </div>
            <span className="text-[10px] text-white font-medium">Home</span>
          </div>
          <div className="flex flex-col items-center py-1 px-3 cursor-pointer" onClick={handleExploreClick}>
            <Compass className="w-5 h-5 text-gray-400 mb-0.5" />
            <span className="text-[10px] text-gray-400">Explore</span>
          </div>
          <div className="flex flex-col items-center py-1 px-3 cursor-pointer" onClick={handleLibraryClick}>
            <div className="relative">
              <Library className="w-5 h-5 text-gray-400 mb-0.5" />
              {user && (syncData.playlists.length > 0 || syncData.likedSongs.length > 0) && (
                <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
              )}
            </div>
            <span className="text-[10px] text-gray-400">Library</span>
          </div>
        </div>
      </nav>
    </div>
  )
}
