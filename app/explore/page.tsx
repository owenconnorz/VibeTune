"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Settings, ChevronRight, Play, ArrowLeft } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { AudioPlayer } from "@/components/audio-player"
import { UpdateNotificationButton } from "@/components/update-notification"
import { SongMenu } from "@/components/song-menu"
import { useAuth } from "@/contexts/auth-context"
import { useLikedSongs } from "@/contexts/liked-songs-context"
import { useAudioPlayer } from "@/contexts/audio-player-context"
import { useSync } from "@/contexts/sync-context"
import { useSettings } from "@/contexts/settings-context"
import { searchMusic } from "@/lib/music-data"
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll"
import { NavigationRouter } from "@/components/navigation-router"

const moodAndGenres = [
  // Mood categories
  { name: "Sleep", query: "sleep music relaxing ambient" },
  { name: "Chill", query: "chill music lofi relaxing" },
  { name: "Focus", query: "focus music concentration study" },
  { name: "Workout", query: "workout music gym motivation" },
  { name: "Party", query: "party music dance upbeat" },
  { name: "Romance", query: "romantic music love songs" },
  { name: "Energize", query: "energetic music upbeat motivational" },
  { name: "Feel good", query: "feel good music happy uplifting" },
  { name: "Sad", query: "sad music emotional melancholy" },
  { name: "Commute", query: "commute music travel road trip" },

  // Genre categories
  { name: "Arabic", query: "arabic music middle eastern" },
  { name: "Blues", query: "blues music classic blues" },
  { name: "Jazz", query: "jazz music smooth jazz" },
  { name: "K-Pop", query: "kpop korean pop music" },
  { name: "J-Pop", query: "jpop japanese pop music" },
  { name: "Latin", query: "latin music reggaeton salsa" },
  { name: "Folk & acoustic", query: "folk acoustic indie music" },
  { name: "Indie & alternative", query: "indie alternative rock music" },
  { name: "Bollywood & Indian", query: "bollywood indian music hindi" },
  { name: "African", query: "african music afrobeat world music" },
  { name: "Christian & gospel", query: "christian gospel worship music" },
  { name: "Family", query: "family music kids children songs" },
  { name: "Mandopop & cantopop", query: "mandopop cantopop chinese music" },
  { name: "Summer", query: "summer music beach tropical" },
]

export default function ExplorePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { likedSongs } = useLikedSongs()
  const { syncData } = useSync()
  const { adultContentEnabled } = useSettings()
  const { playTrack } = useAudioPlayer()
  const [profileSettings, setProfileSettings] = useState<any>(null)
  const [selectedCategory, setSelectedCategory] = useState<{ name: string; query: string } | null>(null)

  const {
    items: categoryMusic,
    loading,
    hasMore,
    reset: resetCategoryMusic,
  } = useInfiniteScroll({
    fetchMore: async (page: number) => {
      if (!selectedCategory) {
        return { items: [], hasMore: false }
      }

      console.log("[v0] Fetching category music page:", page, "for:", selectedCategory.name)
      const results = await searchMusic(selectedCategory.query)

      return {
        items: results,
        hasMore: results.length >= 10 && page < 4, // Limit to 4 pages max
      }
    },
    enabled: !!selectedCategory,
    threshold: 600,
  })

  useEffect(() => {
    const settings = localStorage.getItem("vibetuneProfileSettings")
    if (settings) {
      setProfileSettings(JSON.parse(settings))
    }
  }, [])

  const handleCategoryClick = async (category: { name: string; query: string }) => {
    setSelectedCategory(category)
    resetCategoryMusic() // Reset infinite scroll when selecting new category
  }

  const handleBackToCategories = () => {
    setSelectedCategory(null)
    resetCategoryMusic() // Reset infinite scroll when going back to categories
  }

  const getProfileImage = () => {
    if (profileSettings?.useCustomPicture && profileSettings?.customPicture) {
      return profileSettings.customPicture
    }
    return user?.picture || "/diverse-user-avatars.png"
  }

  const handleSearchClick = () => router.push("/search")
  const handleSettingsClick = () => router.push("/settings")
  const handleLibraryClick = () => router.push("/library")
  const handleHomeClick = () => router.push("/")
  const handleVideosClick = () => router.push("/videos")

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <header className="flex items-center justify-between px-4 py-2 bg-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-purple-500 rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-xs">♪</span>
          </div>
          <h1 className="text-lg font-semibold text-white">VibeTune</h1>
        </div>
        <div className="flex items-center gap-2">
          <UpdateNotificationButton />
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
                profileSettings?.useCustomPicture && profileSettings?.customPictureUrl
                  ? profileSettings.customPictureUrl
                  : user?.picture || "/diverse-group-making-music.png"
              }
            />
            <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
        </div>
      </header>

      <nav className="flex gap-6 px-4 py-2 bg-zinc-800 border-b border-zinc-700">
        <button onClick={() => router.push("/")} className="text-gray-300 hover:text-white font-medium text-sm">
          History
        </button>
        <button onClick={() => router.push("/")} className="text-gray-300 hover:text-white font-medium text-sm">
          Stats
        </button>
        <button
          onClick={() => router.push("/library/liked")}
          className="text-gray-300 hover:text-white font-medium text-sm relative"
        >
          Liked
          {user && syncData.likedSongs.length > 0 && (
            <span className="absolute -top-1 -right-2 bg-yellow-600 text-black text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
              {syncData.likedSongs.length > 99 ? "99+" : syncData.likedSongs.length}
            </span>
          )}
        </button>
        <button className="text-gray-300 hover:text-white font-medium text-sm">Downloaded</button>
      </nav>

      {/* Main Content */}
      <main className="p-4 pb-20">
        {!selectedCategory ? (
          /* Mood and Genres Section */
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-yellow-400">Mood and Genres</h2>
              <ChevronRight className="w-6 h-6 text-gray-400" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {moodAndGenres.map((category) => (
                <button
                  key={category.name}
                  onClick={() => handleCategoryClick(category)}
                  className="bg-gray-800 hover:bg-gray-700 transition-colors rounded-lg p-4 text-left"
                >
                  <span className="text-white font-medium">{category.name}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Category Music Results */
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <Button variant="ghost" size="icon" onClick={handleBackToCategories}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h2 className="text-2xl font-bold text-yellow-400">{selectedCategory.name}</h2>
            </div>

            {loading && categoryMusic.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
                <span className="ml-3 text-gray-400">Loading {selectedCategory.name} music...</span>
              </div>
            ) : categoryMusic.length > 0 ? (
              <div className="space-y-4">
                {categoryMusic.map((song, index) => (
                  <div
                    key={`${song.id}-${index}`}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <div className="relative">
                      <img
                        src={song.thumbnail || "/placeholder.svg?height=60&width=60"}
                        alt={song.title}
                        className="w-15 h-15 rounded-lg object-cover"
                      />
                      <button
                        onClick={() => playTrack(song)}
                        className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity rounded-lg"
                      >
                        <Play className="w-6 h-6 text-white" />
                      </button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white truncate">{song.title}</h3>
                      <p className="text-sm text-gray-400 truncate">{song.artist}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-400">{song.duration}</span>
                      <SongMenu song={song} />
                    </div>
                  </div>
                ))}

                {loading && categoryMusic.length > 0 && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400"></div>
                    <span className="ml-3 text-gray-400">Loading more {selectedCategory.name} music...</span>
                  </div>
                )}

                {!hasMore && categoryMusic.length > 0 && !loading && (
                  <div className="text-center py-6">
                    <p className="text-gray-400">You've reached the end • {categoryMusic.length} songs total</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-400">No music found for {selectedCategory.name}</div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Audio Player */}
      <AudioPlayer />

      {/* Navigation Router */}
      <NavigationRouter />
    </div>
  )
}
