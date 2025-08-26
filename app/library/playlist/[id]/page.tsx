"use client"

import type React from "react"

import { useState, useMemo, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Play, Heart, Edit, Trash2, Music, Download, Camera, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { usePlaylist } from "@/contexts/playlist-context"
import { useAudioPlayer } from "@/contexts/audio-player-context"
import { SongMenu } from "@/components/song-menu"

interface PlaylistPageProps {
  params: {
    id: string
  }
}

const VirtualizedSongList = ({
  songs,
  onPlaySong,
  onRemoveSong,
}: {
  songs: any[]
  onPlaySong: (song: any, songList: any[]) => void
  onRemoveSong: (songId: string) => void
}) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 })
  const containerRef = useRef<HTMLDivElement>(null)
  const itemHeight = 64 // Height of each song item in pixels
  const containerHeight = 600 // Max height of the scrollable container

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const scrollTop = e.currentTarget.scrollTop
      const start = Math.floor(scrollTop / itemHeight)
      const visibleCount = Math.ceil(containerHeight / itemHeight)
      const end = Math.min(start + visibleCount + 10, songs.length) // Add buffer of 10 items

      setVisibleRange({ start: Math.max(0, start - 5), end }) // Add buffer before visible area
    },
    [songs.length],
  )

  const visibleSongs = useMemo(() => {
    return songs.slice(visibleRange.start, visibleRange.end)
  }, [songs, visibleRange])

  const totalHeight = songs.length * itemHeight
  const offsetY = visibleRange.start * itemHeight

  return (
    <div className="relative">
      <div ref={containerRef} className="overflow-auto" style={{ maxHeight: containerHeight }} onScroll={handleScroll}>
        <div style={{ height: totalHeight, position: "relative" }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            {visibleSongs.map((song, index) => {
              const actualIndex = visibleRange.start + index
              if (!song || typeof song !== "object" || !song.id) {
                console.warn("[v0] Invalid song object:", song)
                return null
              }

              const isVideo = song.isVideo || song.source === "eporner" || song.id?.startsWith("eporner_")

              return (
                <div
                  key={`${song.id}-${actualIndex}`}
                  className="flex items-center gap-4 p-3 hover:bg-zinc-800/50 rounded-lg cursor-pointer group"
                  style={{ height: itemHeight }}
                  onClick={() => onPlaySong(song, songs)}
                >
                  <div className="w-4 text-gray-500 text-sm">{actualIndex + 1}</div>
                  <div className="w-12 h-12 bg-zinc-700 rounded flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                    {song.thumbnail ? (
                      <img
                        src={song.thumbnail || "/placeholder.svg"}
                        alt={song.title || "Song"}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : isVideo ? (
                      <Video className="w-6 h-6 text-gray-400" />
                    ) : (
                      <Music className="w-6 h-6 text-gray-400" />
                    )}
                    {isVideo && (
                      <div className="absolute bottom-0 right-0 bg-black/70 text-white text-xs px-1 rounded-tl">
                        <Video className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">{song.title || "Unknown Title"}</h3>
                    <p className="text-gray-400 text-sm truncate">
                      {isVideo ? "Adult Video" : song.artist || "Unknown Artist"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {song.duration && <span className="text-gray-500 text-sm">{song.duration}</span>}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemoveSong(song.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <SongMenu song={song} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PlaylistPage({ params }: PlaylistPageProps) {
  const router = useRouter()
  const { getPlaylist, updatePlaylist, deletePlaylist, removeSongFromPlaylist } = usePlaylist()
  const { playQueue, playTrack } = useAudioPlayer()
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [isDownloading, setIsDownloading] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const playlist = getPlaylist(params.id)

  const handlePlaySong = useCallback(
    (song: any, songList: any[]) => {
      const isVideo = song.isVideo || song.source === "eporner" || song.id?.startsWith("eporner_")

      if (isVideo) {
        const videoTrack = {
          id: song.id,
          title: song.title,
          artist: song.artist || "Adult Video",
          thumbnail: song.thumbnail,
          duration: song.duration,
          videoUrl: song.videoUrl || song.url,
          isVideo: true,
          source: "eporner",
        }
        playTrack(videoTrack)
      } else {
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
    },
    [playQueue, playTrack],
  )

  const handleRemoveSong = useCallback(
    (songId: string) => {
      if (confirm("Remove this song from the playlist?")) {
        removeSongFromPlaylist(params.id, songId)
      }
    },
    [removeSongFromPlaylist, params.id],
  )

  const handlePlayAll = useCallback(() => {
    if (playlist?.songs.length > 0) {
      const hasVideos = playlist.songs.some(
        (song) => song.isVideo || song.source === "eporner" || song.id?.startsWith("eporner_"),
      )

      if (hasVideos) {
        const firstSong = playlist.songs[0]
        handlePlaySong(firstSong, playlist.songs)
      } else {
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
  }, [playlist?.songs, playQueue, handlePlaySong])

  const handleDownloadAll = useCallback(async () => {
    if (!playlist?.songs.length) return

    setIsDownloading(true)
    try {
      const songList = playlist.songs
        .map((song, index) => `${index + 1}. ${song.title} - ${song.artist} (${song.duration || "Unknown duration"})`)
        .join("\n")

      const playlistInfo =
        `Playlist: ${playlist.title}\n` +
        `Description: ${playlist.description || "No description"}\n` +
        `Songs: ${playlist.songs.length}\n` +
        `Created: ${new Date(playlist.createdAt).toLocaleDateString()}\n\n` +
        songList

      const blob = new Blob([playlistInfo], { type: "text/plain" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${playlist.title.replace(/[^a-z0-9]/gi, "_")}_playlist.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Download failed:", error)
    } finally {
      setIsDownloading(false)
    }
  }, [playlist])

  const handleImageUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      if (!file.type.startsWith("image/")) {
        alert("Please select an image file")
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        alert("Image size must be less than 5MB")
        return
      }

      setIsUploadingImage(true)
      try {
        const reader = new FileReader()
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string
          updatePlaylist(params.id, {
            thumbnail: dataUrl,
          })
          setIsUploadingImage(false)
        }
        reader.onerror = () => {
          alert("Failed to read image file")
          setIsUploadingImage(false)
        }
        reader.readAsDataURL(file)
      } catch (error) {
        console.error("Image upload failed:", error)
        alert("Failed to upload image")
        setIsUploadingImage(false)
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    },
    [updatePlaylist, params.id],
  )

  const handleImageClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

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

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
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
            <div
              className="relative w-48 h-48 bg-zinc-700 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer group hover:bg-zinc-600 transition-colors"
              onClick={handleImageClick}
            >
              {playlist.thumbnail ? (
                <img
                  src={playlist.thumbnail || "/placeholder.svg"}
                  alt={playlist.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Music className="w-16 h-16 text-gray-400" />
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {isUploadingImage ? (
                  <div className="text-white text-sm">Uploading...</div>
                ) : (
                  <div className="text-white text-center">
                    <Camera className="w-8 h-8 mx-auto mb-2" />
                    <div className="text-sm">Change Image</div>
                  </div>
                )}
              </div>
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

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
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDownloadAll}
          disabled={playlist.songs.length === 0 || isDownloading}
          className="text-gray-400 hover:text-white disabled:opacity-50"
          title="Download playlist info"
        >
          <Download className={`w-5 h-5 ${isDownloading ? "animate-pulse" : ""}`} />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleEdit} className="text-gray-400 hover:text-white">
          <Edit className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleDelete} className="text-gray-400 hover:text-red-400">
          <Trash2 className="w-5 h-5" />
        </Button>
      </div>

      <div className="px-6 pb-32">
        {playlist.songs.length === 0 ? (
          <div className="text-center py-12">
            <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No songs in this playlist</h3>
            <p className="text-gray-400 mb-4">Add songs to get started</p>
          </div>
        ) : (
          <VirtualizedSongList songs={playlist.songs} onPlaySong={handlePlaySong} onRemoveSong={handleRemoveSong} />
        )}
      </div>
    </div>
  )
}
