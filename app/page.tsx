"use client"

import React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
import { Search, Settings, MoreVertical, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AudioPlayer } from "@/components/audio-player"
import { useAudioPlayer } from "@/contexts/audio-player-context"
import { useAuth } from "@/contexts/auth-context"
import { useSync } from "@/contexts/sync-context"
import { useSettings } from "@/contexts/settings-context"
import { useTrendingMusic, useMoodPlaylist, useNewReleases } from "@/hooks/use-music-data"
import { SongSkeleton, ErrorMessage } from "@/components/loading-skeleton"
import { useRouter } from "next/navigation"
import { OptimizedImage } from "@/components/optimized-image"
import { NavigationRouter } from "@/components/navigation-router"

const MemoizedSongItem = React.memo(({ song, onPlay, trendingSongs }: any) => (
  <div
    className="flex items-center gap-3 cursor-pointer hover:bg-zinc-800/50 rounded-md p-2 transition-colors"
    onClick={() => onPlay(song, trendingSongs)}
  >
    <OptimizedImage
      src={song.thumbnail}
      alt={`${song.title} thumbnail`}
      width={40}
      height={40}
      className="w-10 h-10 rounded-md object-cover flex-shrink-0"
    />
    <div className="flex-1 min-w-0">
      <h3 className="text-white font-normal text-sm truncate">{song.title}</h3>
      <p className="text-gray-400 text-xs truncate">{song.artist}</p>
    </div>
    <div className="text-xs text-gray-500">{song.duration}</div>
    <MoreVertical className="w-4 h-4 text-gray-400" />
  </div>
))

const MusicCard = React.memo(({ song, onPlay, songList }: any) => (
  <div className="flex-shrink-0 w-40 cursor-pointer group" onClick={() => onPlay(song, songList)}>
    <div className="relative rounded-lg overflow-hidden mb-3">
      <OptimizedImage
        src={song.thumbnail}
        alt={`${song.title} thumbnail`}
        width={160}
        height={160}
        className="w-full h-40 object-cover transition-transform group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
          <Play className="w-4 h-4 text-black fill-black" />
        </div>
      </div>
    </div>
    <h3 className="text-white font-medium text-sm truncate mb-1">{song.title}</h3>
    <p className="text-gray-400 text-xs truncate">{song.artist}</p>
  </div>
))

const CategoryItem = React.memo(({ category, onClick, flag }: any) => (
  <div
    className="flex items-center gap-3 cursor-pointer hover:bg-zinc-800/50 rounded-md p-3 transition-colors"
    onClick={onClick}
  >
    <span className="text-lg flex-shrink-0">{flag || "🎵"}</span>
    <div className="flex-1 min-w-0">
      <h3 className="text-white font-normal text-sm">{category.title}</h3>
    </div>
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
      { title: "Hip-Hop Classics", flag: "🇺🇸" },
      { title: "R&B Party-Starters", flag: "🇺🇸" },
      { title: "K-Pop Hits", flag: "🇰🇷" },
      { title: "UK Drill", flag: "🇬🇧" },
      { title: "Latin Reggaeton", flag: "🇵🇷" },
      { title: "Afrobeats", flag: "🇳🇬" },
      { title: "French Rap", flag: "🇫🇷" },
      { title: "German Hip-Hop", flag: "🇩🇪" },
      { title: "Italian Pop", flag: "🇮🇹" },
      { title: "Japanese City Pop", flag: "🇯🇵" },
    ],
    [],
  )

  const quickPicksSongs = useMemo(() => {
    if (safeTrendingSongs.length === 0) return []
    return safeTrendingSongs.slice(0, 8)
  }, [safeTrendingSongs])

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-4 bg-black/95 backdrop-blur-xl border-b border-zinc-800/50 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
            <span className="text-black font-bold text-xs">VT</span>
          </div>
          <h1 className="text-xl font-normal text-white">VibeTune</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white hover:bg-zinc-800 w-8 h-8"
            onClick={() => router.push("/search")}
          >
            <Search className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white hover:bg-zinc-800 w-8 h-8"
            onClick={() => router.push("/settings")}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="page-content px-4">
        <div className="space-y-8">
          <section className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Quick picks</h2>
              <Button
                variant="ghost"
                className="text-red-500 hover:text-red-400 hover:bg-zinc-800/50 text-sm font-medium"
                onClick={() => router.push("/explore")}
              >
                Show all
              </Button>
            </div>
            {trendingError ? (
              <ErrorMessage message={trendingError} onRetry={refetchTrending} />
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-4">
                {trendingLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex-shrink-0 w-40">
                        <div className="w-full h-40 bg-zinc-800 rounded-lg animate-pulse mb-3" />
                        <div className="h-4 bg-zinc-800 rounded animate-pulse mb-2" />
                        <div className="h-3 bg-zinc-800 rounded animate-pulse w-3/4" />
                      </div>
                    ))
                  : quickPicksSongs.map((song) => (
                      <MusicCard key={song.id} song={song} onPlay={handlePlaySong} songList={safeTrendingSongs} />
                    ))}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Mixed for you</h2>
              <Button
                variant="ghost"
                className="text-red-500 hover:text-red-400 hover:bg-zinc-800/50 text-sm font-medium"
                onClick={() => router.push("/explore")}
              >
                Show all
              </Button>
            </div>
            {mixedError ? (
              <ErrorMessage message={mixedError} onRetry={() => window.location.reload()} />
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-4">
                {mixedLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex-shrink-0 w-40">
                        <div className="w-full h-40 bg-zinc-800 rounded-lg animate-pulse mb-3" />
                        <div className="h-4 bg-zinc-800 rounded animate-pulse mb-2" />
                        <div className="h-3 bg-zinc-800 rounded animate-pulse w-3/4" />
                      </div>
                    ))
                  : safeMixedForYouSongs
                      .slice(0, 6)
                      .map((song) => (
                        <MusicCard key={song.id} song={song} onPlay={handlePlaySong} songList={safeMixedForYouSongs} />
                      ))}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">New releases for you</h2>
              <Button
                variant="ghost"
                className="text-red-500 hover:text-red-400 hover:bg-zinc-800/50 text-sm font-medium"
                onClick={() => router.push("/explore")}
              >
                Show all
              </Button>
            </div>
            {newReleasesError ? (
              <ErrorMessage message={newReleasesError} onRetry={refetchNewReleases} />
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-4">
                {newReleasesLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex-shrink-0 w-40">
                        <div className="w-full h-40 bg-zinc-800 rounded-lg animate-pulse mb-3" />
                        <div className="h-4 bg-zinc-800 rounded animate-pulse mb-2" />
                        <div className="h-3 bg-zinc-800 rounded animate-pulse w-3/4" />
                      </div>
                    ))
                  : safeNewReleasesSongs.map((song) => (
                      <MusicCard key={song.id} song={song} onPlay={handlePlaySong} songList={safeNewReleasesSongs} />
                    ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">Listen again</h2>
            {trendingError ? (
              <ErrorMessage message={trendingError} onRetry={refetchTrending} />
            ) : (
              <div className="space-y-1">
                {trendingLoading
                  ? Array.from({ length: 6 }).map((_, i) => <SongSkeleton key={i} />)
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

          <section>
            <h2 className="text-xl font-bold text-white mb-4">Explore</h2>
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
              <h2 className="text-lg font-normal text-white mb-4">Your Library</h2>
              <div className="space-y-1">
                {syncData.likedSongs.length > 0 && (
                  <div
                    className="flex items-center gap-3 cursor-pointer hover:bg-zinc-800/50 rounded-md p-3 transition-colors"
                    onClick={() => router.push("/library")}
                  >
                    <span className="text-lg flex-shrink-0">❤️</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-normal text-sm">Liked Songs</h3>
                      <p className="text-gray-400 text-xs">{syncData.likedSongs.length} songs</p>
                    </div>
                  </div>
                )}
                {syncData.playlists.slice(0, 5).map((playlist) => (
                  <div
                    key={playlist.id}
                    className="flex items-center gap-3 cursor-pointer hover:bg-zinc-800/50 rounded-md p-3 transition-colors"
                    onClick={() => router.push("/library")}
                  >
                    <OptimizedImage
                      src={playlist.thumbnail}
                      alt={playlist.title}
                      width={24}
                      height={24}
                      className="w-6 h-6 rounded-sm object-cover flex-shrink-0"
                      fallback="/music-playlist-concept.png"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-normal text-sm truncate">{playlist.title}</h3>
                      <p className="text-gray-400 text-xs">{playlist.videoCount} songs</p>
                    </div>
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
