"use client"

import React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
import { Search, Settings, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AudioPlayer } from "@/components/audio-player"
import { useAudioPlayer } from "@/contexts/audio-player-context"
import { useAuth } from "@/contexts/auth-context"
import { useSync } from "@/contexts/sync-context"
import { useSettings } from "@/contexts/settings-context"
import { SongMenu } from "@/components/song-menu"
import { DownloadedIcon } from "@/components/downloaded-icon"
import { useTrendingMusic, useMoodPlaylist, useNewReleases } from "@/hooks/use-music-data"
import { SongSkeleton, ErrorMessage } from "@/components/loading-skeleton"
import { useRouter } from "next/navigation"
import { OptimizedImage } from "@/components/optimized-image"
import { NavigationRouter } from "@/components/navigation-router"

const MemoizedSongItem = React.memo(({ song, onPlay, trendingSongs }: any) => (
  <div
    className="flex items-center gap-3 cursor-pointer hover:bg-zinc-800/30 rounded-lg p-3 transition-colors"
    onClick={() => onPlay(song, trendingSongs)}
  >
    <OptimizedImage
      src={song.thumbnail}
      alt={`${song.title} thumbnail`}
      width={48}
      height={48}
      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
    />
    <div className="flex-1 min-w-0">
      <h3 className="text-white font-medium text-sm truncate">{song.title}</h3>
      <p className="text-gray-400 text-xs truncate">{song.artist}</p>
    </div>
    <div className="text-xs text-gray-500">{song.duration}</div>
    <div className="flex items-center gap-1">
      <DownloadedIcon songId={song.id} className="w-4 h-4" />
      <SongMenu song={song} />
    </div>
  </div>
))

const CategoryItem = React.memo(({ category, onClick, flag }: any) => (
  <div
    className="flex items-center gap-3 cursor-pointer hover:bg-zinc-800/30 rounded-lg p-3 transition-colors"
    onClick={onClick}
  >
    <div className="w-8 h-8 bg-zinc-700 rounded-lg flex items-center justify-center flex-shrink-0">
      <span className="text-lg">{flag || "🎵"}</span>
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="text-white font-medium text-sm truncate">{category.title}</h3>
      <p className="text-gray-400 text-xs truncate">{category.description}</p>
    </div>
    <Play className="w-4 h-4 text-gray-400" />
  </div>
))

export default function VibeTunePage() {
  const [profileSettings, setProfileSettings] = useState({
    useCustomPicture: false,
    customPictureUrl: null as string | null,
  })

  const router = useRouter()
  const { user } = useAuth()
  const { syncData } = useSync()
  const { adultContentEnabled } = useSettings()
  const { playTrack, playQueue, state } = useAudioPlayer()
  const {
    songs: trendingSongs,
    loading: trendingLoading,
    error: trendingError,
    source: trendingSource,
    refetch: refetchTrending,
  } = useTrendingMusic()
  const {
    songs: mixedForYouSongs,
    loading: mixedLoading,
    error: mixedError,
    source: mixedSource,
  } = useMoodPlaylist(["mixed for you playlist 2024", "personalized music mix", "discover weekly hits"])
  const {
    songs: newReleasesSongs,
    loading: newReleasesLoading,
    error: newReleasesError,
    source: newReleasesSource,
    refetch: refetchNewReleases,
  } = useNewReleases()

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
  const safeNewReleasesSongs = useMemo(
    () => (Array.isArray(newReleasesSongs) ? newReleasesSongs : []),
    [newReleasesSongs],
  )

  useEffect(() => {
    if (safeTrendingSongs.length > 0 && !state.currentTrack && !trendingLoading) {
      const firstTrack = convertToTrack(safeTrendingSongs[0])
      playTrack(firstTrack)
    }
  }, [safeTrendingSongs, state.currentTrack, trendingLoading, playTrack, convertToTrack])

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

  useEffect(() => {
    const timer = setTimeout(() => {
      // prefetchPopularGenres()
    }, 3000)

    return () => clearTimeout(timer)
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
  const handleVideosClick = useCallback(() => router.push("/videos"), [router])

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
            <div
              key={playlist.id}
              className="flex-shrink-0 w-48 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleLibraryClick}
            >
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
              <h3 className="text-white font-semibold truncate">{playlist.title}</h3>
              <p className="text-gray-400 text-sm truncate">{playlist.videoCount} songs</p>
            </div>
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
                      <span className="text-white font-bold text-xs">❤️</span>
                    </div>
                    <h3 className="text-white font-bold text-lg">Liked Songs</h3>
                    <p className="text-white/80 font-bold text-sm">{syncData.likedSongs.length} songs</p>
                  </div>
                </div>
              </div>
              <h3 className="text-white font-semibold truncate">Liked Songs</h3>
              <p className="text-gray-400 text-sm truncate">{syncData.likedSongs.length} songs</p>
            </div>
          )}
        </div>
      </section>
    )
  }, [user, syncData.playlists, syncData.likedSongs, handleLibraryClick])

  const musicCategories = useMemo(
    () => [
      {
        title: "Hip-Hop Classics",
        description: "The Notorious B.I.G., Tupac, Nas",
        flag: "🇺🇸",
      },
      {
        title: "R&B Party-Starters",
        description: "Destiny's Child, Beyoncé, Usher",
        flag: "🇺🇸",
      },
      {
        title: "K-Pop Hits",
        description: "BTS, BLACKPINK, NewJeans",
        flag: "🇰🇷",
      },
      {
        title: "UK Drill",
        description: "Central Cee, Dave, AJ Tracey",
        flag: "🇬🇧",
      },
      {
        title: "Latin Reggaeton",
        description: "Bad Bunny, J Balvin, Ozuna",
        flag: "🇵🇷",
      },
    ],
    [],
  )

  const quickPicksSongs = useMemo(() => {
    if (safeTrendingSongs.length === 0) return []
    return safeTrendingSongs.slice(0, 8)
  }, [safeTrendingSongs])

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">V</span>
          </div>
          <h1 className="text-xl font-semibold text-white">VibeTune</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-300 hover:text-white hover:bg-zinc-800 w-9 h-9"
            onClick={handleSearchClick}
          >
            <Search className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-300 hover:text-white hover:bg-zinc-800 w-9 h-9"
            onClick={handleSettingsClick}
          >
            <Settings className="w-5 h-5" />
          </Button>
          <Avatar className="w-8 h-8">
            <AvatarImage src={user?.picture || "/diverse-group-making-music.png"} />
            <AvatarFallback className="bg-zinc-700 text-white text-sm">{user?.name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
        </div>
      </header>

      <nav className="flex gap-8 px-4 py-3 bg-zinc-900 border-b border-zinc-800">
        <button className="text-white font-medium text-sm border-b-2 border-purple-500 pb-1">Home</button>
        <button className="text-gray-400 hover:text-white font-medium text-sm">Trending</button>
        <button className="text-gray-400 hover:text-white font-medium text-sm">New</button>
        <button className="text-gray-400 hover:text-white font-medium text-sm">Genres</button>
      </nav>

      <div className="px-4 pb-20">
        <div className="space-y-6">
          <section className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Recently Played</h2>
              {trendingSource === "fallback" && (
                <span className="text-xs text-orange-400 bg-orange-400/10 px-2 py-1 rounded">Offline</span>
              )}
            </div>

            {trendingError ? (
              <ErrorMessage message={trendingError} onRetry={refetchTrending} />
            ) : (
              <div className="space-y-1">
                {trendingLoading
                  ? Array.from({ length: 6 }).map((_, i) => <SongSkeleton key={i} />)
                  : quickPicksSongs.map((song) => (
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

          <section>
            <h2 className="text-lg font-semibold text-white mb-4">Browse</h2>
            <div className="space-y-1">
              {musicCategories.map((category, index) => (
                <CategoryItem
                  key={index}
                  category={category}
                  flag={category.flag}
                  onClick={() => router.push(`/genre/${category.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}`)}
                />
              ))}
            </div>
          </section>

          {user && (syncData.playlists.length > 0 || syncData.likedSongs.length > 0) && (
            <section>
              <h2 className="text-lg font-semibold text-white mb-4">Your Library</h2>
              <div className="space-y-1">
                {syncData.likedSongs.length > 0 && (
                  <div
                    className="flex items-center gap-3 cursor-pointer hover:bg-zinc-800/30 rounded-lg p-3 transition-colors"
                    onClick={() => router.push("/library")}
                  >
                    <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm">❤️</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium text-sm">Liked Songs</h3>
                      <p className="text-gray-400 text-xs">{syncData.likedSongs.length} songs</p>
                    </div>
                    <Play className="w-4 h-4 text-gray-400" />
                  </div>
                )}
                {syncData.playlists.slice(0, 3).map((playlist) => (
                  <div
                    key={playlist.id}
                    className="flex items-center gap-3 cursor-pointer hover:bg-zinc-800/30 rounded-lg p-3 transition-colors"
                    onClick={() => router.push("/library")}
                  >
                    <OptimizedImage
                      src={playlist.thumbnail}
                      alt={playlist.title}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                      fallback="/music-playlist-concept.png"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium text-sm truncate">{playlist.title}</h3>
                      <p className="text-gray-400 text-xs">{playlist.videoCount} songs</p>
                    </div>
                    <Play className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <AudioPlayer />
      <NavigationRouter />
    </div>
  )
}
