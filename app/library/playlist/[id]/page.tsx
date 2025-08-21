"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Play, Heart, Edit, Trash2, Music } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { usePlaylist } from "@/contexts/playlist-context"
import { useAudioPlayer } from "@/contexts/audio-player-context"
import { SongMenu } from "@/components/song-menu"
import { DownloadedIcon } from "@/components/downloaded-icon"

interface PlaylistPageProps {
  params: {
    id: string
  }
}

export default function PlaylistPage({ params }: PlaylistPageProps) {
  const router = useRouter()
  const { getPlaylist, updatePlaylist, deletePlaylist, removeSongFromPlaylist } = usePlaylist()
  const { playQueue } = useAudioPlayer()
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")

  const playlist = getPlaylist(params.id)

  if (!playlist) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Playlist not found</h1>
          <p className="text-gray-400 mb-4">The playlist you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/library")} className="bg-yellow-600 hover:bg-yellow-700 text-black">
            Back to Library
          </Button>
        </div>
      </div>
    )
  }

  const handleEdit = () => {
    setEditTitle(playlist.title)
    setEditDescription(playlist.description)
    setIsEditing(true)
  }

  const handleSave = () => {
    updatePlaylist(params.id, {
      title: editTitle.trim() || playlist.title,
      description: editDescription.trim(),
    })
    setIsEditing(false)
  }

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${playlist.title}"?`)) {
      deletePlaylist(params.id)
      router.push("/library")
    }
  }

  const handlePlayAll = () => {
    if (playlist.songs.length > 0) {
      const tracks = playlist.songs.map((song) => ({
        id: song.id,
        title: song.title,
        artist: song.artist,
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
      artist: s.artist,
      thumbnail: s.thumbnail,
      duration: s.duration,
    }))
    const startIndex = songList.findIndex((s) => s.id === song.id)
    playQueue(tracks, startIndex)
  }

  const handleRemoveSong = (songId: string) => {
    if (confirm("Remove this song from the playlist?")) {
      removeSongFromPlaylist(params.id, songId)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Header */}
      <header className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-600/20 to-zinc-900" />
        <div className="relative p-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-white hover:bg-white/10 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="flex items-end gap-6">
            <div className="w-48 h-48 bg-zinc-700 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
              {playlist.thumbnail ? (
                <img
                  src={playlist.thumbnail || "/placeholder.svg"}
                  alt={playlist.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Music className="w-16 h-16 text-gray-400" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-300 mb-2">Playlist</p>
              {isEditing ? (
                <div className="space-y-4">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="text-4xl font-bold bg-transparent border-white/20 text-white"
                    placeholder="Playlist title"
                  />
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="bg-transparent border-white/20 text-white"
                    placeholder="Add a description..."
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSave} size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-black">
                      Save
                    </Button>
                    <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-4xl font-bold mb-2 truncate">{playlist.title}</h1>
                  {playlist.description && <p className="text-gray-300 mb-4">{playlist.description}</p>}
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>{playlist.songs.length} songs</span>
                    <span>•</span>
                    <span>Created {new Date(playlist.createdAt).toLocaleDateString()}</span>
                    {playlist.updatedAt !== playlist.createdAt && (
                      <>
                        <span>•</span>
                        <span>Updated {new Date(playlist.updatedAt).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Controls */}
      <div className="px-6 py-4 flex items-center gap-4">
        <Button
          onClick={handlePlayAll}
          disabled={playlist.songs.length === 0}
          className="bg-yellow-600 hover:bg-yellow-700 text-black font-semibold"
        >
          <Play className="w-5 h-5 mr-2" />
          Play All
        </Button>
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
          <Heart className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleEdit} className="text-gray-400 hover:text-white">
          <Edit className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleDelete} className="text-gray-400 hover:text-red-400">
          <Trash2 className="w-5 h-5" />
        </Button>
      </div>

      {/* Songs List */}
      <div className="px-6 pb-32">
        {playlist.songs.length === 0 ? (
          <div className="text-center py-12">
            <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No songs in this playlist</h3>
            <p className="text-gray-400 mb-4">Add songs to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {playlist.songs.map((song, index) => (
              <div
                key={`${song.id}-${index}`}
                className="flex items-center gap-4 p-3 hover:bg-zinc-800/50 rounded-lg cursor-pointer group"
                onClick={() => handlePlaySong(song, playlist.songs)}
              >
                <div className="w-4 text-gray-500 text-sm">{index + 1}</div>
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
                </div>
                <div className="flex items-center gap-2">
                  {song.duration && <span className="text-gray-500 text-sm">{song.duration}</span>}
                  <DownloadedIcon songId={song.id} />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveSong(song.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <SongMenu song={song} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
