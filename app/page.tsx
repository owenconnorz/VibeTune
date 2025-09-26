"use client"

import React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
import { Search, Settings, MoreVertical, Play, Sparkles, CheckCircle, Heart, Clock } from "lucide-react"
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
    className="flex items-center gap-3 cursor-pointer hover:bg-zinc-800/50 rounded-lg p-3 transition-all duration-200 ease-out group"
    onClick={() => onPlay(song, trendingSongs)}
  >
    <div className="relative">
      <OptimizedImage
        src={song.thumbnail}
        alt={`${song.title} thumbnail`}
        width={48}
        height={48}
        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 rounded-lg" />
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200">
        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
          <Play className="w-3 h-3 text-black fill-black" />
        </div>
      </div>
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="text-white font-medium text-sm truncate">{song.title}</h3>
      <p className="text-gray-400 text-xs truncate">{song.artist}</p>
    </div>
    <div className="text-xs text-gray-500">{song.duration}</div>
    <MoreVertical className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-all duration-200" />
  </div>
))

const MusicCard = React.memo(({ song, onPlay, songList }: any) => (
  <div className="flex-shrink-0 w-44 cursor-pointer group" onClick={() => onPlay(song, songList)}>
    <div className="relative rounded-xl overflow-hidden mb-3 shadow-lg">
      <OptimizedImage
        src={song.thumbnail}
        alt={`${song.title} thumbnail`}
        width={176}
        height={176}
        className="w-full h-44 object-cover transition-all duration-300 ease-out group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-xl">
          <Play className="w-5 h-5 text-black fill-black ml-0.5" />
        </div>
      </div>
    </div>
    <h3 className="text-white font-medium text-sm truncate mb-1 leading-tight">{song.title}</h3>
    <p className="text-gray-400 text-xs truncate">{song.artist}</p>
  </div>
))

const QuickAccessCard = React.memo(({ icon, title, subtitle, onClick }: any) => (
  <div
    className="flex items-center gap-4 p-4 bg-gradient-to-r from-zinc-800/50 to-zinc-700/30 rounded-xl cursor-pointer hover:from-zinc-700/60 hover:to-zinc-600/40 transition-all duration-300 group border border-zinc-700/50"
    onClick={onClick}
  >
    <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="text-white font-medium text-sm truncate">{title}</h3>
      <p className="text-gray-400 text-xs truncate">{subtitle}</p>
    </div>
  </div>
))

export default function VibeTunePage() {
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [pageTransition, setPageTransition] = useState(false)
  const [simpMusicStatus, setSimpMusicStatus] = useState<{
    hasAccess: boolean
    loading: boolean
  }>({ hasAccess: false, loading: true })

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

  useEffect(() => {
    if (user) {
      checkSimpMusicAccess()
    } else {
      setSimpMusicStatus({ hasAccess: false, loading: false })
    }
  }, [user])

  const checkSimpMusicAccess = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const data = await response.json()
        setSimpMusicStatus({
          hasAccess: data.hasYouTubeMusicAccess || false,
          loading: false,
        })
      }
    } catch (error) {
      console.error("Error checking SimpMusic access:", error)
      setSimpMusicStatus({ hasAccess: false, loading: false })
    }
  }

  const convertToTrack = useCallback(
    (song: any) => ({
      id: song.id,
      title: song.title,
      artist: song.artist || song.channelTitle,
      thumbnail: song.thumbnail,
      duration: song.duration,
      url: song.url,
      audioUrl: song.audioUrl,
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

  const handlePlaySong = useCallback(
    (song: any, songList: any) => {
      const track = convertToTrack(song)
      playTrack(track)
      playQueue(songList.slice(songList.indexOf(song) + 1).map(convertToTrack))
    },
    [convertToTrack, playTrack, playQueue],
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
      setIsPageLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [])

  const handleSearchClick = useCallback(() => {
    setPageTransition(true)
    setTimeout(() => router.push("/search"), 150)
  }, [router])

  const handleSettingsClick = useCallback(() => {
    setPageTransition(true)
    setTimeout(() => router.push("/settings"), 150)
  }, [router])

  const handleLibraryClick = useCallback(() => {
    setPageTransition(true)
    setTimeout(() => router.push("/library"), 150)
  }, [router])

  const handleVideosClick = useCallback(() => {
    setPageTransition(true)
    setTimeout(() => router.push("/videos"), 150)
  }, [router])

  const quickPicksSongs = useMemo(() => {
    if (safeTrendingSongs.length === 0) return []
    return safeTrendingSongs.slice(0, 8)
  }, [safeTrendingSongs])

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto animate-pulse shadow-2xl">
            <span className="text-black font-bold text-xl">VT</span>
          </div>
          <div className="text-2xl font-medium text-white">VibeTune</div>
          <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`min-h-screen bg-black text-white transition-all duration-300 ${pageTransition ? "opacity-50 scale-95" : "opacity-100 scale-100"}`}
    >
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-black/95 backdrop-blur-xl border-b border-zinc-800/50 shadow-2xl transition-all duration-300">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-black font-bold text-sm">VT</span>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">VibeTune</h1>
            {user && !simpMusicStatus.loading && (
              <div className="flex items-center gap-1 mt-0.5">
                {simpMusicStatus.hasAccess ? (
                  <>
                    <Sparkles className="w-3 h-3 text-yellow-400" />
                    <span className="text-xs text-yellow-400 font-medium">Enhanced Experience</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-400">Basic Mode</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white hover:bg-zinc-800/60 w-10 h-10 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95"
            onClick={handleSearchClick}
          >
            <Search className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white hover:bg-zinc-800/60 w-10 h-10 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95"
            onClick={handleSettingsClick}
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="page-content px-6 pt-2">
        <div className="space-y-8">
          {user && (syncData.playlists.length > 0 || syncData.likedSongs.length > 0) && (
            <section className="mt-6">
              <div className="grid grid-cols-1 gap-3">
                {syncData.likedSongs.length > 0 && (
                  <QuickAccessCard
                    icon={<Heart className="w-6 h-6 text-white" />}
                    title="Liked Songs"
                    subtitle={`${syncData.likedSongs.length} songs`}
                    onClick={handleLibraryClick}
                  />
                )}
                <QuickAccessCard
                  icon={<Clock className="w-6 h-6 text-white" />}
                  title="Recently Played"
                  subtitle="Your listening history"
                  onClick={handleLibraryClick}
                />
              </div>
            </section>
          )}

          <section className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-white">Quick picks</h2>
                {user && simpMusicStatus.hasAccess && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/20">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="text-xs text-yellow-400 font-medium">Personalized</span>
                  </div>
                )}
              </div>
            </div>
            {trendingError ? (
              <ErrorMessage message={trendingError} onRetry={refetchTrending} />
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {trendingLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex-shrink-0 w-44">
                        <div className="w-full h-44 bg-zinc-800 rounded-xl animate-pulse mb-3" />
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
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-white">Mixed for you</h2>
                {user && simpMusicStatus.hasAccess && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/20">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="text-xs text-yellow-400 font-medium">AI-Powered</span>
                  </div>
                )}
              </div>
            </div>
            {mixedError ? (
              <ErrorMessage message={mixedError} onRetry={() => window.location.reload()} />
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {mixedLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex-shrink-0 w-44">
                        <div className="w-full h-44 bg-zinc-800 rounded-xl animate-pulse mb-3" />
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">New releases</h2>
            </div>
            {newReleasesError ? (
              <ErrorMessage message={newReleasesError} onRetry={refetchNewReleases} />
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {newReleasesLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex-shrink-0 w-44">
                        <div className="w-full h-44 bg-zinc-800 rounded-xl animate-pulse mb-3" />
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
            <h2 className="text-2xl font-bold text-white mb-6">Listen again</h2>
            {trendingError ? (
              <ErrorMessage message={trendingError} onRetry={refetchTrending} />
            ) : (
              <div className="space-y-2">
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
        </div>
      </div>

      <AudioPlayer />
      <NavigationRouter />
    </div>
  )
}
