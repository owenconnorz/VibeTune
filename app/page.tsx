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

const CategoryCard = React.memo(({ category, onClick }: any) => (
  <div className="flex-shrink-0 w-48 cursor-pointer hover:opacity-90 transition-opacity" onClick={onClick}>
    <div className={`relative rounded-lg overflow-hidden mb-3 bg-gradient-to-br ${category.gradient} h-48`}>
      <OptimizedImage
        src={category.image}
        alt={category.title}
        width={192}
        height={192}
        className="w-full h-full object-cover mix-blend-overlay opacity-60"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <div className="absolute bottom-4 left-4 right-4">
        <h3 className="text-white font-bold text-lg leading-tight mb-1">{category.title}</h3>
        <p className="text-white/80 text-sm leading-tight">{category.description}</p>
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

  const musicCategories = useMemo(
    () => [
      {
        title: "Hip-Hop Classics",
        description: "The Notorious B.I.G., Tupac, Nas",
        gradient: "from-blue-600 to-purple-700",
        image: "/placeholder.svg?height=200&width=200&text=Hip-Hop&bg=1e40af&color=white",
      },
      {
        title: "R&B Party-Starters",
        description: "Destiny's Child, Beyoncé, Usher",
        gradient: "from-orange-500 to-red-600",
        image: "/placeholder.svg?height=200&width=200&text=R%26B&bg=ea580c&color=white",
      },
      {
        title: "Classic Pop Party",
        description: "Blondie, Queen, ABBA",
        gradient: "from-pink-500 to-purple-600",
        image: "/placeholder.svg?height=200&width=200&text=Pop&bg=ec4899&color=white",
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
        image: "/placeholder.svg?height=200&width=200&text=Pop%20Rock&bg=fb923c&color=white",
      },
      {
        title: "Happy Pop Hits",
        description: "Ed Sheeran, Bruno Mars, Dua Lipa",
        gradient: "from-yellow-400 to-orange-500",
        image: "/placeholder.svg?height=200&width=200&text=Happy&bg=facc15&color=black",
      },
      {
        title: "Feel-Good R&B Vibes",
        description: "Bruno Mars, The Weeknd, SZA",
        gradient: "from-purple-600 to-pink-600",
        image: "/placeholder.svg?height=200&width=200&text=R%26B&bg=9333ea&color=white",
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
        image: "/placeholder.svg?height=200&width=200&text=80s&bg=60a5fa&color=white",
      },
      {
        title: "Relaxing 80s Rock",
        description: "UB40, Huey Lewis, Phil Collins",
        gradient: "from-gray-600 to-gray-800",
        image: "/placeholder.svg?height=200&width=200&text=80s%20Rock&bg=4b5563&color=white",
      },
      {
        title: "'90s Dance",
        description: "The Chemical Brothers, Fatboy Slim",
        gradient: "from-cyan-400 to-blue-600",
        image: "/placeholder.svg?height=200&width=200&text=90s&bg=22d3ee&color=black",
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
        image: "/placeholder.svg?height=200&width=200&text=K-Pop&bg=f472b6&color=white",
      },
      {
        title: "Pop Royalty",
        description: "Jonas Brothers, Taylor Swift",
        gradient: "from-gray-700 to-black",
        image: "/placeholder.svg?height=200&width=200&text=Pop&bg=374151&color=white",
      },
      {
        title: "House Music",
        description: "Chris Lake, Calvin Harris",
        gradient: "from-blue-600 to-indigo-700",
        image: "/placeholder.svg?height=200&width=200&text=House&bg=2563eb&color=white",
      },
    ],
    [],
  )

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
                      <span className="text-white font-bold text-xs">❤️</span>
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

        {/* Music Categories */}
        <section className="mb-8">
          <div className="flex gap-4 overflow-x-auto pb-4">
            {musicCategories.map((category, index) => (
              <CategoryCard
                key={index}
                category={{
                  ...category,
                  image: safeTrendingSongs[index]?.thumbnail || category.image,
                }}
                onClick={() => router.push(`/genre/${category.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}`)}
              />
            ))}
          </div>
        </section>

        {/* Feel Good */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-yellow-400 mb-6">Feel good</h2>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {feelGoodCategories.map((category, index) => (
              <CategoryCard
                key={index}
                category={{
                  ...category,
                  image: safeTrendingSongs[index + 3]?.thumbnail || category.image,
                }}
                onClick={() => router.push(`/mood/${category.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}`)}
              />
            ))}
          </div>
        </section>

        {/* Music Videos */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-yellow-400 mb-6">Music videos for you</h2>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {safeTrendingSongs.slice(0, 3).map((song, index) => (
              <div
                key={song.id}
                className="flex-shrink-0 w-64 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => handlePlaySong(song, safeTrendingSongs)}
              >
                <div className="relative rounded-lg overflow-hidden mb-3">
                  <OptimizedImage
                    src={song.thumbnail}
                    alt={song.title}
                    width={256}
                    height={144}
                    className="w-full h-36 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <div className="w-0 h-0 border-l-[8px] border-l-white border-y-[6px] border-y-transparent ml-1"></div>
                    </div>
                  </div>
                </div>
                <h3 className="text-white font-semibold text-sm truncate">{song.title}</h3>
                <p className="text-gray-400 text-xs truncate">{song.artist}</p>
              </div>
            ))}
          </div>
        </section>

        {/* New Releases */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-yellow-400 mb-6">New releases</h2>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {safeMixedForYouSongs.slice(0, 3).map((song, index) => (
              <div
                key={song.id}
                className="flex-shrink-0 w-48 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => handlePlaySong(song, safeMixedForYouSongs)}
              >
                <div className="relative rounded-lg overflow-hidden mb-3">
                  <OptimizedImage
                    src={song.thumbnail}
                    alt={song.title}
                    width={192}
                    height={192}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute bottom-2 right-2">
                    <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <div className="w-0 h-0 border-l-[6px] border-l-white border-y-[4px] border-y-transparent ml-0.5"></div>
                    </div>
                  </div>
                </div>
                <h3 className="text-white font-semibold text-sm truncate">{song.title}</h3>
                <p className="text-gray-400 text-xs truncate">{song.artist}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Throwback Thursday */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-yellow-400 mb-6">Throwback Thursday</h2>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {throwbackCategories.map((category, index) => (
              <CategoryCard
                key={index}
                category={{
                  ...category,
                  image: safeTrendingSongs[index + 6]?.thumbnail || category.image,
                }}
                onClick={() => router.push(`/throwback/${category.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}`)}
              />
            ))}
          </div>
        </section>

        {/* Fresh New Music */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-yellow-400 mb-6">Fresh new music</h2>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {freshMusicCategories.map((category, index) => (
              <CategoryCard
                key={index}
                category={{
                  ...category,
                  image: safeMixedForYouSongs[index + 3]?.thumbnail || category.image,
                }}
                onClick={() => router.push(`/fresh/${category.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}`)}
              />
            ))}
          </div>
        </section>

        {/* Albums for You */}
        <section className="mb-8">
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
                <p className="text-gray-400 text-xs truncate">{song.artist}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Take it Easy */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-yellow-400 mb-6">Take it easy</h2>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {safeMixedForYouSongs.slice(6, 9).map((song, index) => (
              <div
                key={song.id}
                className="flex-shrink-0 w-48 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => handlePlaySong(song, safeMixedForYouSongs)}
              >
                <div className="relative rounded-lg overflow-hidden mb-3 bg-gradient-to-br from-green-400 to-blue-500">
                  <OptimizedImage
                    src={song.thumbnail}
                    alt={song.title}
                    width={192}
                    height={192}
                    className="w-full h-48 object-cover mix-blend-overlay opacity-70"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
                <h3 className="text-white font-semibold text-sm truncate">{song.title}</h3>
                <p className="text-gray-400 text-xs truncate">{song.artist}</p>
              </div>
            ))}
          </div>
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
