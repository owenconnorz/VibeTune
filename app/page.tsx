"use client"

import React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
import { Search, Settings } from "lucide-react"
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
import { prefetchGenreData, prefetchPopularGenres } from "@/lib/genre-prefetch"
import { NavigationRouter } from "@/components/navigation-router"

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

const CategoryCardSkeleton = React.memo(() => (
  <div className="flex-shrink-0 w-48">
    <div className="w-full h-48 bg-zinc-700 rounded-lg animate-pulse mb-3"></div>
    <div className="h-4 bg-zinc-700 rounded animate-pulse mb-2"></div>
    <div className="h-3 bg-zinc-700 rounded animate-pulse w-3/4"></div>
  </div>
))

const VideoCardSkeleton = React.memo(() => (
  <div className="flex-shrink-0 w-48">
    <div className="w-full h-48 bg-zinc-700 rounded-lg animate-pulse mb-3"></div>
    <div className="h-4 bg-zinc-700 rounded animate-pulse mb-2"></div>
    <div className="h-3 bg-zinc-700 rounded animate-pulse w-2/3"></div>
  </div>
))

const SectionHeaderSkeleton = React.memo(() => (
  <div className="flex items-center justify-between mb-6">
    <div className="h-8 bg-zinc-700 rounded animate-pulse w-48"></div>
    <div className="h-6 bg-zinc-700 rounded animate-pulse w-20"></div>
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

const CategoryCard = React.memo(({ category, onClick, genreSlug }: any) => {
  const hasRealThumbnail = category.image && category.image.startsWith("https://img.youtube.com")

  const handleMouseEnter = useCallback(() => {
    if (genreSlug) {
      prefetchGenreData(genreSlug, 2) // Prefetch 2 pages on hover
    }
  }, [genreSlug])

  return (
    <div
      className="flex-shrink-0 w-48 cursor-pointer hover:opacity-90 transition-opacity"
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
    >
      <div
        className={`relative rounded-lg overflow-hidden mb-3 h-48 ${
          hasRealThumbnail ? "bg-zinc-800" : `bg-gradient-to-br ${category.gradient}`
        }`}
      >
        {hasRealThumbnail ? (
          <OptimizedImage
            src={category.image}
            alt={category.title}
            width={192}
            height={192}
            className="w-full h-full object-cover"
            fallback={`/placeholder.svg?height=192&width=192&text=${encodeURIComponent(category.title)}&bg=4b5563&color=white`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-white font-bold text-lg">♪</span>
              </div>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-white font-bold text-lg leading-tight mb-1">{category.title}</h3>
          <p className="text-white/80 text-sm leading-tight">{category.description}</p>
        </div>
      </div>
    </div>
  )
})

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
      prefetchPopularGenres()
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
        gradient: "from-blue-600 to-purple-700",
        image: "https://img.youtube.com/vi/5RDSkR8_AQ0/hqdefault.jpg", // Biggie - Juicy
        slug: "hip-hop-classics",
      },
      {
        title: "R&B Party-Starters",
        description: "Destiny's Child, Beyoncé, Usher",
        gradient: "from-orange-500 to-red-600",
        image: "https://img.youtube.com/vi/VBmMU_iwe6U/hqdefault.jpg", // Destiny's Child - Say My Name
        slug: "r-b-party-starters",
      },
      {
        title: "Classic Pop Party",
        description: "Blondie, Queen, ABBA",
        gradient: "from-pink-500 to-purple-600",
        image: "https://img.youtube.com/vi/fJ9rUzIMcZQ/hqdefault.jpg", // Queen - Bohemian Rhapsody
        slug: "classic-pop-party",
      },
    ],
    [],
  )

  const feelGoodCategories = useMemo(
    () => [
      {
        title: "Feel-Good Pop & Rock",
        description: "Ed Sheeran, Taylor Swift, Maroon 5",
        gradient: "from-orange-400 to-red-500",
        image: "https://img.youtube.com/vi/JGwWNGJdvx8/hqdefault.jpg", // Wiz Khalifa - See You Again
        slug: "feel-good-pop-rock",
      },
      {
        title: "Happy Pop Hits",
        description: "Ed Sheeran, Bruno Mars, Dua Lipa",
        gradient: "from-yellow-400 to-orange-500",
        image: "https://img.youtube.com/vi/hT_nvWreIhg/hqdefault.jpg", // Ed Sheeran - Shape of You
        slug: "happy-pop-hits",
      },
      {
        title: "Feel-Good R&B Vibes",
        description: "Bruno Mars, The Weeknd, SZA",
        gradient: "from-purple-600 to-pink-600",
        image: "https://img.youtube.com/vi/UqyT8IEBkvY/hqdefault.jpg", // Bruno Mars - Count On Me
        slug: "feel-good-r-b-vibes",
      },
    ],
    [],
  )

  const throwbackCategories = useMemo(
    () => [
      {
        title: "80s Sing-Alongs",
        description: "Madonna, Kiss, Bon Jovi",
        gradient: "from-blue-400 to-cyan-500",
        image: "https://img.youtube.com/vi/LOZuxwVk7TU/hqdefault.jpg", // Madonna - Material Girl
      },
      {
        title: "Relaxing 80s Rock",
        description: "UB40, Huey Lewis, Phil Collins",
        gradient: "from-gray-600 to-gray-800",
        image: "https://img.youtube.com/vi/YkADj0TPrJA/hqdefault.jpg", // Phil Collins - In The Air Tonight
      },
      {
        title: "'90s Dance",
        description: "The Chemical Brothers, Fatboy Slim",
        gradient: "from-cyan-400 to-blue-600",
        image: "https://img.youtube.com/vi/s5FyfQDO5g0/hqdefault.jpg", // Chemical Brothers - Block Rockin' Beats
      },
    ],
    [],
  )

  const freshMusicCategories = useMemo(
    () => [
      {
        title: "K.iNG",
        description: "IVE, LE SSERAFIM, NewJeans",
        gradient: "from-pink-400 to-purple-600",
        image: "https://img.youtube.com/vi/--FmExEAsM8/hqdefault.jpg", // NewJeans - Get Up
      },
      {
        title: "Pop Royalty",
        description: "Jonas Brothers, Taylor Swift",
        gradient: "from-gray-700 to-black",
        image: "https://img.youtube.com/vi/nfWlot6h_JM/hqdefault.jpg", // Taylor Swift - Shake It Off
      },
      {
        title: "House Music",
        description: "Chris Lake, Calvin Harris",
        gradient: "from-blue-600 to-indigo-700",
        image: "https://img.youtube.com/vi/5NV6Rdv1a3I/hqdefault.jpg", // Calvin Harris - Feel So Close
      },
    ],
    [],
  )

  const quickPicksSongs = useMemo(() => {
    if (safeTrendingSongs.length === 0) return []

    // Create a shuffled version of trending songs for variety on each reload
    const shuffled = [...safeTrendingSongs].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, 6)
  }, [safeTrendingSongs])

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
        <div className="space-y-8">
          {/* User's Synced Content */}
          {userContent}

          {/* Quick Picks - Individual Songs */}
          <section>
            {trendingLoading ? (
              <SectionHeaderSkeleton />
            ) : (
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-yellow-400">Quick Picks</h2>
                <div className="flex items-center gap-2">
                  {trendingSource === "fallback" && (
                    <span className="text-xs text-orange-400 bg-orange-400/10 px-2 py-1 rounded">
                      Using fallback data
                    </span>
                  )}
                </div>
              </div>
            )}

            {trendingError ? (
              <ErrorMessage message={trendingError} onRetry={refetchTrending} />
            ) : (
              <div className="space-y-4 min-h-[400px]">
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

          {/* Music Categories */}
          <section>
            {trendingLoading ? (
              <div className="flex gap-4 overflow-x-auto pb-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <CategoryCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-4 min-h-[220px]">
                {musicCategories.map((category, index) => (
                  <CategoryCard
                    key={index}
                    category={category}
                    genreSlug={category.slug}
                    onClick={() => router.push(`/genre/${category.slug}`)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Feel Good */}
          <section className="mb-8">
            {trendingLoading ? (
              <>
                <div className="h-8 bg-zinc-700 rounded animate-pulse w-32 mb-6"></div>
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <CategoryCardSkeleton key={i} />
                  ))}
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-yellow-400 mb-6">Feel good</h2>
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {feelGoodCategories.map((category, index) => (
                    <CategoryCard
                      key={index}
                      category={category}
                      genreSlug={category.slug}
                      onClick={() => router.push(`/mood/${category.slug}`)}
                    />
                  ))}
                </div>
              </>
            )}
          </section>

          {/* Music Videos */}
          <section className="mb-8">
            {newReleasesLoading ? (
              <>
                <SectionHeaderSkeleton />
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <VideoCardSkeleton key={i} />
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-yellow-400">Music videos for you</h2>
                  <div className="flex items-center gap-2">
                    {newReleasesSource === "fallback" && (
                      <span className="text-xs text-orange-400 bg-orange-400/10 px-2 py-1 rounded">
                        Using fallback data
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {newReleasesError ? (
                    <div className="text-red-400 text-sm">Failed to load new releases</div>
                  ) : (
                    safeNewReleasesSongs.slice(0, 6).map((song, index) => (
                      <div
                        key={song.id}
                        className="flex-shrink-0 w-48 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => handlePlaySong(song, safeNewReleasesSongs)}
                      >
                        <div className="relative rounded-lg overflow-hidden mb-3">
                          <OptimizedImage
                            src={song.thumbnail}
                            alt={song.title}
                            width={192}
                            height={192}
                            className="w-full h-48 object-cover"
                          />
                        </div>
                        <h3 className="text-white font-semibold text-sm truncate">{song.title}</h3>
                        <p className="text-gray-400 text-sm truncate">{song.artist}</p>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </section>

          {/* Throwback Thursday */}
          <section className="mb-8">
            {trendingLoading ? (
              <>
                <div className="h-8 bg-zinc-700 rounded animate-pulse w-48 mb-6"></div>
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <CategoryCardSkeleton key={i} />
                  ))}
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-yellow-400 mb-6">Throwback Thursday</h2>
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {throwbackCategories.map((category, index) => (
                    <CategoryCard
                      key={index}
                      category={category}
                      onClick={() =>
                        router.push(`/throwback/${category.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}`)
                      }
                    />
                  ))}
                </div>
              </>
            )}
          </section>

          {/* Fresh New Music */}
          <section className="mb-8">
            {trendingLoading ? (
              <>
                <div className="h-8 bg-zinc-700 rounded animate-pulse w-40 mb-6"></div>
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <CategoryCardSkeleton key={i} />
                  ))}
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-yellow-400 mb-6">Fresh new music</h2>
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {freshMusicCategories.map((category, index) => (
                    <CategoryCard
                      key={index}
                      category={category}
                      onClick={() => router.push(`/fresh/${category.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}`)}
                    />
                  ))}
                </div>
              </>
            )}
          </section>

          {/* Albums for You */}
          <section className="mb-8">
            {trendingLoading ? (
              <>
                <div className="h-8 bg-zinc-700 rounded animate-pulse w-36 mb-6"></div>
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <VideoCardSkeleton key={i} />
                  ))}
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-yellow-400 mb-6">Albums for you</h2>
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {safeTrendingSongs.slice(3, 6).map((song, index) => (
                    <div
                      key={song.id}
                      className="flex-shrink-0 w-48 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => handlePlaySong(song, safeTrendingSongs)}
                    >
                      <div className="relative rounded-lg overflow-hidden mb-3">
                        <OptimizedImage
                          src={song.thumbnail}
                          alt={song.title}
                          width={192}
                          height={192}
                          className="w-full h-48 object-cover"
                        />
                      </div>
                      <h3 className="text-white font-semibold text-sm truncate">{song.title}</h3>
                      <p className="text-gray-400 text-sm truncate">{song.artist}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          {/* Take it Easy */}
          <section className="mb-8">
            {mixedLoading ? (
              <>
                <div className="h-8 bg-zinc-700 rounded animate-pulse w-32 mb-6"></div>
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <VideoCardSkeleton key={i} />
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-yellow-400">Take it easy</h2>
                  <div className="flex items-center gap-2">
                    {mixedSource === "fallback" && (
                      <span className="text-xs text-orange-400 bg-orange-400/10 px-2 py-1 rounded">
                        Using fallback data
                      </span>
                    )}
                  </div>
                </div>

                {mixedError ? (
                  <ErrorMessage message={mixedError} />
                ) : (
                  <div className="flex gap-4 overflow-x-auto pb-4">
                    <div
                      className="flex-shrink-0 w-48 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => router.push("/library/your-mix")}
                    >
                      <div className="relative rounded-lg overflow-hidden mb-3">
                        <OptimizedImage
                          src="https://img.youtube.com/vi/hT_nvWreIhg/hqdefault.jpg"
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
                          src="https://img.youtube.com/vi/kJQP7kiw5Fk/hqdefault.jpg"
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
                          src="https://img.youtube.com/vi/09R8_2nJtjg/hqdefault.jpg"
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
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>

      <AudioPlayer />

      {/* Bottom Navigation */}
      <NavigationRouter />
    </div>
  )
}
