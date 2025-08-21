"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Music, Search, Settings, ChevronRight, Home, Compass, Library, Play, ArrowLeft } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { AudioPlayer } from "@/components/audio-player"
import { UpdateNotificationButton } from "@/components/update-notification"
import { SongMenu } from "@/components/song-menu"
import { DownloadedIcon } from "@/components/downloaded-icon"
import { useAuth } from "@/contexts/auth-context"
import { useLikedSongs } from "@/contexts/liked-songs-context"
import { useAudioPlayer } from "@/contexts/audio-player-context"
import { searchMusic } from "@/lib/music-data"

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
  const { playTrack } = useAudioPlayer()
  const [profileSettings, setProfileSettings] = useState<any>(null)
  const [selectedCategory, setSelectedCategory] = useState<{ name: string; query: string } | null>(null)
  const [categoryMusic, setCategoryMusic] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const settings = localStorage.getItem("vibetuneProfileSettings")
    if (settings) {
      setProfileSettings(JSON.parse(settings))
    }
  }, [])

  const handleCategoryClick = async (category: { name: string; query: string }) => {
    setSelectedCategory(category)
    setLoading(true)
    setCategoryMusic([])

    try {
      const results = await searchMusic(category.query)
      setCategoryMusic(results)
    } catch (error) {
      console.error("Error fetching category music:", error)
      setCategoryMusic([])
    } finally {
      setLoading(false)
    }
  }

  const handleBackToCategories = () => {
    setSelectedCategory(null)
    setCategoryMusic([])
  }

  const getProfileImage = () => {
    if (profileSettings?.useCustomPicture && profileSettings?.customPicture) {
      return profileSettings.customPicture
    }
    return user?.picture || "/diverse-user-avatars.png"
  }

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      {/* Header */}
      <header className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Music className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold">VibeTune</h1>
        </div>

        <div className="flex items-center gap-4">
          <UpdateNotificationButton />
          <Button variant="ghost" size="icon" onClick={() => router.push("/search")}>
            <Search className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => router.push("/settings")}>
            <Settings className="w-5 h-5" />
          </Button>
          <Avatar className="w-10 h-10">
            <AvatarImage src={getProfileImage() || "/placeholder.svg"} alt="Profile" />
            <AvatarFallback>{user?.name?.[0] || "U"}</AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="flex gap-8 px-4 py-4">
        <button onClick={() => router.push("/")} className="text-gray-400 hover:text-white transition-colors">
          History
        </button>
        <button onClick={() => router.push("/")} className="text-gray-400 hover:text-white transition-colors">
          Stats
        </button>
        <button
          onClick={() => router.push("/library/liked")}
          className="text-gray-400 hover:text-white transition-colors flex items-center gap-2"
        >
          Liked
          {likedSongs.length > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">{likedSongs.length}</span>
          )}
        </button>
        <button
          onClick={() => router.push("/library/downloaded")}
          className="text-gray-400 hover:text-white transition-colors"
        >
          Downloaded
        </button>
      </nav>

      {/* Main Content */}
      <main className="p-4">
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

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-400">Loading {selectedCategory.name} music...</div>
              </div>
            ) : categoryMusic.length > 0 ? (
              <div className="space-y-4">
                {categoryMusic.map((song, index) => (
                  <div
                    key={song.id || index}
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
                      <DownloadedIcon song={song} />
                      <SongMenu song={song} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-12">
                <div className="text-gray-400">No music found for {selectedCategory.name}</div>
              </div>
            )}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 z-40">
        <div className="flex justify-around py-2">
          <button onClick={() => router.push("/")} className="flex flex-col items-center gap-1 p-2">
            <Home className="w-6 h-6 text-gray-400" />
            <span className="text-xs text-gray-400">Home</span>
          </button>

          <button onClick={() => router.push("/explore")} className="flex flex-col items-center gap-1 p-2">
            <Compass className="w-6 h-6 text-yellow-500" />
            <span className="text-xs text-yellow-500 font-medium">Explore</span>
          </button>

          <button onClick={() => router.push("/library")} className="flex flex-col items-center gap-1 p-2">
            <Library className="w-6 h-6 text-gray-400" />
            <span className="text-xs text-gray-400">Library</span>
          </button>
        </div>
      </nav>

      {/* Audio Player */}
      <AudioPlayer />
    </div>
  )
}
