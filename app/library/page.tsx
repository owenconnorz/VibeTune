"use client"

import { useState } from "react"
import Link from "next/link"
import { User, Grid3X3, Heart, CheckCircle, Play, Plus, Search, MoreVertical, Trash2, Music } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"
import { useSync } from "@/contexts/sync-context"
import { usePlaylist } from "@/contexts/playlist-context"
import { useAudioPlayer } from "@/contexts/audio-player-context"
import { useDownload } from "@/contexts/download-context"
import { AddToPlaylistDialog } from "@/components/add-to-playlist-dialog"
import { DownloadManager } from "@/components/download-manager"
import { DownloadButton } from "@/components/download-button"

export default function LibraryPage() {
  const { user } = useAuth()
  const { syncData } = useSync()
  const { playlists: localPlaylists, createPlaylist, deletePlaylist } = usePlaylist()
  const { downloadedSongs } = useDownload()
  const { state, playTrack, playQueue } = useAudioPlayer()
  const [activeTab, setActiveTab] = useState<"playlists" | "songs" | "albums" | "artists" | "downloads">("playlists")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "date" | "count">("date")

  const systemPlaylists = [
    {
      id: "liked",
      title: "Liked Songs",
      icon: Heart,
      count: syncData.likedSongs.length,
      color: "text-red-500",
      type: "system" as const,
      songs: syncData.likedSongs,
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
  ]

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

  const allSongs = [
    ...syncData.likedSongs,
    ...syncData.playlists.flatMap((p) => p.videos || []),
    ...localPlaylists.flatMap((p) => p.songs),
  ].filter((song, index, self) => index === self.findIndex((s) => s.id === song.id))

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

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <header className="flex items-center justify-between p-4 bg-zinc-900">
        <h1 className="text-2xl font-bold text-white">Library</h1>
        <div className="flex items-center gap-4">
          {activeTab === "playlists" && (
            <Button onClick={handleCreatePlaylist} size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-black">
              <Plus className="w-4 h-4 mr-2" />
              New Playlist
            </Button>
          )}
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <User className="w-6 h-6" />
          </Button>
        </div>
      </header>

      <nav className="flex gap-8 px-4 py-4 bg-zinc-900 border-b border-zinc-800">
        {[
          { key: "playlists", label: "Playlists", count: allPlaylists.length },
          { key: "songs", label: "Songs", count: allSongs.length },
          { key: "downloads", label: "Downloads", count: downloadedSongs.length },
          { key: "albums", label: "Albums", count: 0 },
          { key: "artists", label: "Artists", count: 0 },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`font-medium text-lg flex items-center gap-2 ${
              activeTab === tab.key ? "text-white" : "text-gray-400 hover:text-gray-300"
            }`}
            onClick={() => setActiveTab(tab.key as any)}
          >
            {tab.label}
            {tab.count > 0 && <span className="text-xs bg-zinc-700 px-2 py-1 rounded-full">{tab.count}</span>}
          </button>
        ))}
      </nav>

      <div className="flex items-center justify-between px-4 py-4 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-zinc-800 border-zinc-700 text-white"
            />
          </div>
          {activeTab === "playlists" && (
            <div className="flex items-center gap-2 text-gray-300">
              <span className="text-sm">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-zinc-800 border-zinc-700 text-white text-sm rounded px-2 py-1"
              >
                <option value="date">Date updated</option>
                <option value="name">Name</option>
                <option value="count">Song count</option>
              </select>
            </div>
          )}
        </div>
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
          <Grid3X3 className="w-5 h-5" />
        </Button>
      </div>

      <div className="px-4 pb-32">
        {activeTab === "playlists" && (
          <div className="grid grid-cols-2 gap-4">
            {filteredPlaylists.map((playlist) => (
              <Card
                key={playlist.id}
                className="bg-zinc-800 border-zinc-700 hover:bg-zinc-750 transition-colors cursor-pointer group"
                onClick={() => handlePlayPlaylist(playlist)}
              >
                <CardContent className="p-4 relative">
                  <div className="aspect-square mb-3 bg-zinc-700 rounded-lg flex items-center justify-center overflow-hidden relative">
                    {playlist.thumbnail ? (
                      <img
                        src={playlist.thumbnail || "/placeholder.svg"}
                        alt={playlist.title}
                        className="w-full h-full object-cover"
                      />
                    ) : playlist.icon ? (
                      <playlist.icon className={`w-12 h-12 ${playlist.color}`} />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <Music className="w-8 h-8 text-white" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-sm mb-1 truncate">{playlist.title}</h3>
                      <p className="text-gray-400 text-xs">
                        {playlist.count || playlist.songs?.length || playlist.videos?.length || 0} song
                        {(playlist.count || playlist.songs?.length || playlist.videos?.length || 0) !== 1 ? "s" : ""}
                      </p>
                      <p className="text-gray-500 text-xs capitalize mt-1">{playlist.type}</p>
                    </div>
                    {playlist.type === "local" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeletePlaylist(playlist.id)
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
              <div className="col-span-2 text-center py-12">
                <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">{searchQuery ? "No playlists found" : "No playlists yet"}</p>
                {!searchQuery && (
                  <Button onClick={handleCreatePlaylist} className="bg-yellow-600 hover:bg-yellow-700 text-black">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Playlist
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "songs" && (
          <div className="space-y-2">
            {filteredSongs.map((song, index) => (
              <div
                key={`${song.id}-${index}`}
                className="flex items-center gap-4 p-3 hover:bg-zinc-800/50 rounded-lg cursor-pointer group"
                onClick={() => handlePlaySong(song, filteredSongs)}
              >
                <div className="w-12 h-12 bg-zinc-700 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
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
                  <h3 className="text-white font-medium truncate">{song.title}</h3>
                  <p className="text-gray-400 text-sm truncate">
                    {song.channelTitle || song.artist || "Unknown Artist"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {song.duration && <span className="text-gray-500 text-sm">{song.duration}</span>}
                  <DownloadButton song={song} />
                  <AddToPlaylistDialog
                    songs={[song]}
                    trigger={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    }
                  />
                </div>
              </div>
            ))}
            {filteredSongs.length === 0 && (
              <div className="text-center py-12">
                <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">{searchQuery ? "No songs found" : "No songs in your library yet"}</p>
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
                <div className="space-y-2">
                  {filteredDownloadedSongs.map((song, index) => (
                    <div
                      key={`${song.id}-${index}`}
                      className="flex items-center gap-4 p-3 hover:bg-zinc-800/50 rounded-lg cursor-pointer group"
                      onClick={() => handlePlaySong(song, filteredDownloadedSongs)}
                    >
                      <div className="w-12 h-12 bg-zinc-700 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
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
                        <h3 className="text-white font-medium truncate">{song.title}</h3>
                        <p className="text-gray-400 text-sm truncate">{song.artist}</p>
                        <p className="text-green-500 text-xs">Downloaded {song.completedAt?.toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-sm">
                          {song.size ? `${(song.size / (1024 * 1024)).toFixed(1)} MB` : ""}
                        </span>
                        <AddToPlaylistDialog
                          songs={[song]}
                          trigger={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {(activeTab === "albums" || activeTab === "artists") && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
              {activeTab === "albums" ? (
                <div className="w-8 h-8 bg-zinc-600 rounded"></div>
              ) : (
                <User className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <p className="text-gray-400 mb-2">{activeTab === "albums" ? "Albums" : "Artists"} coming soon</p>
            <p className="text-gray-500 text-sm">We're working on organizing your music by {activeTab}</p>
          </div>
        )}
      </div>

      {state.currentTrack && (
        <div className="fixed bottom-20 left-0 right-0 bg-zinc-800 border-t border-zinc-700 p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-zinc-700 rounded flex items-center justify-center overflow-hidden">
              {state.currentTrack.thumbnail ? (
                <img
                  src={state.currentTrack.thumbnail || "/placeholder.svg"}
                  alt={state.currentTrack.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Music className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-semibold text-sm truncate">{state.currentTrack.title}</h4>
              <p className="text-gray-400 text-xs truncate">{state.currentTrack.artist}</p>
            </div>
            <div className="flex items-center gap-2">
              <AddToPlaylistDialog
                songs={[
                  {
                    id: state.currentTrack.id,
                    title: state.currentTrack.title,
                    artist: state.currentTrack.artist,
                    thumbnail: state.currentTrack.thumbnail,
                    duration: state.currentTrack.duration,
                  },
                ]}
                trigger={
                  <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                    <Plus className="w-5 h-5" />
                  </Button>
                }
              />
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <Heart className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800">
        <div className="flex items-center justify-around py-3">
          <Link href="/" className="flex flex-col items-center gap-1">
            <div className="w-6 h-6 text-gray-400 hover:text-white transition-colors">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
              </svg>
            </div>
            <span className="text-xs text-gray-400 hover:text-white transition-colors">Home</span>
          </Link>

          <Link href="/?search=true" className="flex flex-col items-center gap-1">
            <div className="w-6 h-6 text-gray-400 hover:text-white transition-colors">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5S13.09 5 9.5 5 5 7.01 5 9.5 7.01 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
            </div>
            <span className="text-xs text-gray-400 hover:text-white transition-colors">Search</span>
          </Link>

          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 bg-yellow-600 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <span className="text-xs text-white font-medium">Library</span>
          </div>
        </div>
      </div>
    </div>
  )
}
