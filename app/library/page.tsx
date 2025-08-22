"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  User,
  Heart,
  CheckCircle,
  Play,
  Plus,
  Search,
  Trash2,
  Music,
  Settings,
  Home,
  Compass,
  Library,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AudioPlayer } from "@/components/audio-player"
import { UpdateNotificationButton } from "@/components/update-notification"
import { useAuth } from "@/contexts/auth-context"
import { useSync } from "@/contexts/sync-context"
import { usePlaylist } from "@/contexts/playlist-context"
import { useAudioPlayer } from "@/contexts/audio-player-context"
import { useDownload } from "@/contexts/download-context"
import { DownloadManager } from "@/components/download-manager"
import { SongMenu } from "@/components/song-menu"
import { useLikedSongs } from "@/contexts/liked-songs-context"

export default function LibraryPage() {
  const { user } = useAuth()
  const { syncData } = useSync()
  const { likedSongs: localLikedSongs } = useLikedSongs()
  const { playlists: localPlaylists, createPlaylist, deletePlaylist } = usePlaylist()
  const { downloadedSongs } = useDownload()
  const { state, playTrack, playQueue } = useAudioPlayer()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"playlists" | "songs" | "albums" | "artists" | "downloads">("playlists")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "date" | "count">("date")

  const [importedPlaylists, setImportedPlaylists] = useState<any[]>([])
  const [videoPlaylists, setVideoPlaylists] = useState<Array<{ id: string; name: string; videos: any[] }>>([])

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
    try {
      const saved = localStorage.getItem("vibetuneImportedPlaylists")
      if (saved) {
        setImportedPlaylists(JSON.parse(saved))
      }
    } catch (error) {
      console.error("Failed to load imported playlists:", error)
    }

    try {
      const savedVideoPlaylists = localStorage.getItem("videoPlaylists")
      if (savedVideoPlaylists) {
        setVideoPlaylists(JSON.parse(savedVideoPlaylists))
      }
    } catch (error) {
      console.error("Failed to load video playlists:", error)
    }
  }, [])

  const [profileSettings, setProfileSettings] = useState({
    useCustomPicture: false,
    customPictureUrl: null as string | null,
  })

  const allLikedSongs = [
    ...syncData.likedSongs,
    ...localLikedSongs.map((song) => ({
      id: song.id,
      title: song.title,
      channelTitle: song.artist,
      thumbnail: song.thumbnail,
      duration: song.duration,
    })),
  ].filter((song, index, self) => index === self.findIndex((s) => s.id === song.id))

  const systemPlaylists = [
    {
      id: "liked",
      title: "Liked Songs",
      icon: Heart,
      count: allLikedSongs.length,
      color: "text-red-500",
      type: "system" as const,
      songs: allLikedSongs,
    },
    {
      id: "downloaded",
      title: "Downloaded",
      icon: CheckCircle,
      count: downloadedSongs.length,
      color: "text-green-500",
      type: "system" as const,
      songs: downloadedSongs,
    },
  ]

  const allPlaylists = [
    ...systemPlaylists,
    ...syncData.playlists.map((p) => ({ ...p, type: "synced" as const })),
    ...localPlaylists.map((p) => ({ ...p, type: "local" as const })),
    ...importedPlaylists.map((p) => ({ ...p, type: "imported" as const })),
    ...videoPlaylists.map((p) => ({
      ...p,
      type: "video" as const,
      title: p.name,
      count: p.videos.length,
      thumbnail: p.videos[0]?.thumb || p.videos[0]?.default_thumb?.src,
    })),
  ]

  const allSongs = [
    ...allLikedSongs,
    ...syncData.playlists.flatMap((p) => p.videos || []),
    ...localPlaylists.flatMap((p) => p.songs),
  ].filter((song, index, self) => index === self.findIndex((s) => s.id === song.id))

  const filteredPlaylists = allPlaylists
    .filter((playlist) => playlist.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.title.localeCompare(b.title)
        case "count":
          return (b.count || b.songs?.length || 0) - (a.count || a.songs?.length || 0)
        case "date":
        default:
          if (a.type === "system") return -1
          if (b.type === "system") return 1
          const aDate = "updatedAt" in a ? new Date(a.updatedAt) : new Date()
          const bDate = "updatedAt" in b ? new Date(b.updatedAt) : new Date()
          return bDate.getTime() - aDate.getTime()
      }
    })

  const filteredSongs = allSongs.filter(
    (song) =>
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (song.channelTitle || song.artist || "").toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredDownloadedSongs = downloadedSongs.filter(
    (song) =>
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handlePlayPlaylist = (playlist: any) => {
    if (playlist.id === "liked") {
      router.push("/library/liked")
      return
    }

    if (playlist.id === "downloaded") {
      router.push("/library/downloaded")
      return
    }

    if (playlist.type === "video") {
      router.push(`/library/video-playlist/${playlist.id}`)
      return
    }

    if (playlist.type === "local") {
      router.push(`/library/playlist/${playlist.id}`)
      return
    }

    if (playlist.type === "imported") {
      const songs = playlist.videos || []
      if (songs.length > 0) {
        const tracks = songs.map((song: any) => ({
          id: song.id,
          title: song.title,
          artist: song.channelTitle || song.artist || "Unknown Artist",
          thumbnail: song.thumbnail,
          duration: song.duration,
        }))
        playQueue(tracks, 0)
      }
      return
    }

    const songs = playlist.songs || playlist.videos || []
    if (songs.length > 0) {
      const tracks = songs.map((song: any) => ({
        id: song.id,
        title: song.title,
        artist: song.channelTitle || song.artist || "Unknown Artist",
        thumbnail: song.thumbnail,
        duration: song.duration,
      }))
      playQueue(tracks, 0)
    }
  }

  const handlePlaySong = (song: any, songList: any[]) => {
    const tracks = songList.map((s: any) => ({
      id: s.id,
      title: s.title,
      artist: s.channelTitle || s.artist || "Unknown Artist",
      thumbnail: s.thumbnail,
      duration: s.duration,
    }))
    const startIndex = songList.findIndex((s) => s.id === song.id)
    playQueue(tracks, startIndex)
  }

  const handleCreatePlaylist = () => {
    const name = prompt("Enter playlist name:")
    if (name?.trim()) {
      createPlaylist(name.trim())
    }
  }

  const handleDeletePlaylist = (playlistId: string) => {
    if (confirm("Are you sure you want to delete this playlist?")) {
      deletePlaylist(playlistId)
    }
  }

  const handleDeleteImportedPlaylist = (playlistId: string) => {
    if (confirm("Are you sure you want to delete this imported playlist?")) {
      const updatedPlaylists = importedPlaylists.filter((p) => p.id !== playlistId)
      setImportedPlaylists(updatedPlaylists)
      localStorage.setItem("vibetuneImportedPlaylists", JSON.stringify(updatedPlaylists))
    }
  }

  const handleDeleteVideoPlaylist = (playlistId: string) => {
    if (confirm("Are you sure you want to delete this video playlist?")) {
      const updatedPlaylists = videoPlaylists.filter((p) => p.id !== playlistId)
      setVideoPlaylists(updatedPlaylists)
      localStorage.setItem("videoPlaylists", JSON.stringify(updatedPlaylists))
    }
  }

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
            onClick={() => setSearchQuery("")}
          >
            <Search className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-300 hover:text-white w-8 h-8"
            onClick={() => router.push("/settings")}
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

      <nav className="flex gap-6 px-4 py-2 bg-zinc-800 border-b border-zinc-700">
        <button className="text-gray-300 hover:text-white font-medium text-sm">History</button>
        <button className="text-gray-300 hover:text-white font-medium text-sm">Stats</button>
        <button className="text-gray-300 hover:text-white font-medium text-sm relative">
          Liked
          {user && allLikedSongs.length > 0 && (
            <span className="absolute -top-1 -right-2 bg-yellow-600 text-black text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
              {allLikedSongs.length > 99 ? "99+" : allLikedSongs.length}
            </span>
          )}
        </button>
        <button className="text-gray-300 hover:text-white font-medium text-sm">Downloaded</button>
      </nav>

      <div className="flex items-center justify-between px-6 py-4 bg-zinc-900 border-b border-zinc-800">
        <h2 className="text-2xl font-bold text-white">Your Library</h2>
        {activeTab === "playlists" && (
          <Button
            onClick={handleCreatePlaylist}
            size="sm"
            className="bg-yellow-600 hover:bg-yellow-700 text-black font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Playlist
          </Button>
        )}
      </div>

      <div className="px-6 py-6 pb-32">
        {activeTab === "playlists" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredPlaylists.map((playlist) => (
                <Card
                  key={playlist.id}
                  className="bg-zinc-800 border-zinc-700 hover:bg-zinc-750 transition-all duration-200 cursor-pointer group hover:scale-105"
                  onClick={() => handlePlayPlaylist(playlist)}
                >
                  <CardContent className="p-4 relative">
                    <div className="aspect-square mb-3 bg-zinc-700 rounded-xl flex items-center justify-center overflow-hidden relative shadow-lg">
                      {playlist.thumbnail ? (
                        <img
                          src={playlist.thumbnail || "/placeholder.svg"}
                          alt={playlist.title}
                          className="w-full h-full object-cover"
                        />
                      ) : playlist.icon ? (
                        <playlist.icon className={`w-12 h-12 ${playlist.color}`} />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                          <Music className="w-10 h-10 text-white" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-10 h-10 text-white drop-shadow-lg" />
                      </div>
                    </div>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-sm mb-1 truncate leading-tight">
                          {playlist.title}
                        </h3>
                        <p className="text-gray-400 text-xs mb-1">
                          {playlist.count || playlist.songs?.length || playlist.videos?.length || 0} song
                          {(playlist.count || playlist.songs?.length || playlist.videos?.length || 0) !== 1 ? "s" : ""}
                        </p>
                        <p className="text-gray-500 text-xs capitalize">{playlist.type}</p>
                      </div>
                      {(playlist.type === "local" || playlist.type === "imported" || playlist.type === "video") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-400 h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (playlist.type === "local") {
                              handleDeletePlaylist(playlist.id)
                            } else if (playlist.type === "imported") {
                              handleDeleteImportedPlaylist(playlist.id)
                            } else if (playlist.type === "video") {
                              handleDeleteVideoPlaylist(playlist.id)
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredPlaylists.length === 0 && (
                <div className="col-span-full text-center py-16">
                  <Music className="w-20 h-20 text-gray-600 mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">
                    {searchQuery ? "No playlists found" : "No playlists yet"}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {searchQuery ? "Try adjusting your search terms" : "Create your first playlist to get started"}
                  </p>
                  {!searchQuery && (
                    <Button
                      onClick={handleCreatePlaylist}
                      className="bg-yellow-600 hover:bg-yellow-700 text-black font-medium"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Playlist
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "songs" && (
          <div className="space-y-1">
            {filteredSongs.map((song, index) => (
              <div
                key={`${song.id}-${index}`}
                className="flex items-center gap-4 p-3 hover:bg-zinc-800/50 rounded-lg cursor-pointer group transition-colors"
                onClick={() => handlePlaySong(song, filteredSongs)}
              >
                <div className="w-12 h-12 bg-zinc-700 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                  {song.thumbnail ? (
                    <img
                      src={song.thumbnail || "/placeholder.svg"}
                      alt={song.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Music className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium truncate leading-tight">{song.title}</h3>
                  <p className="text-gray-400 text-sm truncate">
                    {song.channelTitle || song.artist || "Unknown Artist"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {song.duration && <span className="text-gray-500 text-sm font-mono">{song.duration}</span>}
                  <SongMenu song={song} />
                </div>
              </div>
            ))}
            {filteredSongs.length === 0 && (
              <div className="text-center py-16">
                <Music className="w-20 h-20 text-gray-600 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">
                  {searchQuery ? "No songs found" : "No songs in your library yet"}
                </h3>
                <p className="text-gray-500">
                  {searchQuery ? "Try adjusting your search terms" : "Start adding songs to your playlists"}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "downloads" && (
          <div className="space-y-6">
            <DownloadManager />

            {downloadedSongs.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Downloaded Songs</h3>
                <div className="space-y-1">
                  {filteredDownloadedSongs.map((song, index) => (
                    <div
                      key={`${song.id}-${index}`}
                      className="flex items-center gap-4 p-3 hover:bg-zinc-800/50 rounded-lg cursor-pointer group transition-colors"
                      onClick={() => handlePlaySong(song, filteredDownloadedSongs)}
                    >
                      <div className="w-12 h-12 bg-zinc-700 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                        {song.thumbnail ? (
                          <img
                            src={song.thumbnail || "/placeholder.svg"}
                            alt={song.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Music className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium truncate leading-tight">{song.title}</h3>
                        <p className="text-gray-400 text-sm truncate">{song.artist}</p>
                        <p className="text-green-500 text-xs">Downloaded {song.completedAt?.toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500 text-sm font-mono">
                          {song.size ? `${(song.size / (1024 * 1024)).toFixed(1)} MB` : ""}
                        </span>
                        <SongMenu song={song} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {(activeTab === "albums" || activeTab === "artists") && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
              {activeTab === "albums" ? (
                <div className="w-10 h-10 bg-zinc-600 rounded-lg"></div>
              ) : (
                <User className="w-10 h-10 text-gray-400" />
              )}
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              {activeTab === "albums" ? "Albums" : "Artists"} coming soon
            </h3>
            <p className="text-gray-500">We're working on organizing your music by {activeTab}</p>
          </div>
        )}
      </div>

      <AudioPlayer />

      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-800 border-t border-zinc-700">
        <div className="flex items-center justify-around py-1">
          <div className="flex flex-col items-center py-1 px-3 cursor-pointer" onClick={() => router.push("/")}>
            <Home className="w-5 h-5 text-gray-400 mb-0.5" />
            <span className="text-[10px] text-gray-400">Home</span>
          </div>
          <div className="flex flex-col items-center py-1 px-3">
            <Compass className="w-5 h-5 text-gray-400 mb-0.5" />
            <span className="text-[10px] text-gray-400">Explore</span>
          </div>
          <div className="flex flex-col items-center py-1 px-3">
            <div className="bg-yellow-600 rounded-full p-1.5 mb-0.5">
              <Library className="w-4 h-4 text-black" />
            </div>
            <span className="text-[10px] text-white font-medium">Library</span>
          </div>
        </div>
      </nav>
    </div>
  )
}
