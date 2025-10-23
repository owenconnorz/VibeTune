"use client"

import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { savePlaylist } from "@/lib/playlist-storage"
import type { YouTubeVideo } from "@/lib/youtube"

interface ImportPlaylistDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPlaylistImported?: () => void
}

export function ImportPlaylistDialog({ open, onOpenChange, onPlaylistImported }: ImportPlaylistDialogProps) {
  const [playlistUrl, setPlaylistUrl] = useState("")
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState("")

  const handleImport = async () => {
    if (!playlistUrl.trim()) {
      setError("Please enter a playlist URL")
      return
    }

    setIsImporting(true)
    setError("")

    try {
      console.log("[v0] Starting playlist import with URL:", playlistUrl)

      const response = await fetch("/api/playlist/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: playlistUrl }),
      })

      const data = await response.json()

      console.log("[v0] Import API response:", {
        success: data.success,
        playlistName: data.playlist?.name,
        videosCount: data.playlist?.videos?.length || 0,
        firstVideo: data.playlist?.videos?.[0] || null,
      })

      if (!data.success) {
        setError(data.error || "Failed to import playlist")
        setIsImporting(false)
        return
      }

      if (!data.playlist.videos || data.playlist.videos.length === 0) {
        console.error("[v0] No videos in imported playlist")
        setError("Playlist imported but no songs were found")
        setIsImporting(false)
        return
      }

      console.log("[v0] Saving playlist with", data.playlist.videos.length, "videos")

      // Save the imported playlist
      const savedPlaylist = savePlaylist({
        name: data.playlist.name,
        description: data.playlist.description || "Imported from YouTube Music",
        coverImage: data.playlist.coverImage,
        videos: data.playlist.videos as YouTubeVideo[],
      })

      console.log("[v0] Playlist saved:", savedPlaylist)

      setPlaylistUrl("")
      setError("")
      setIsImporting(false)
      onOpenChange(false)
      onPlaylistImported?.()
    } catch (err: any) {
      console.error("[v0] Import error:", err)
      setError(err.message || "Failed to import playlist")
      setIsImporting(false)
    }
  }

  const handleCancel = () => {
    setPlaylistUrl("")
    setError("")
    onOpenChange(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={handleCancel} />

      {/* Dialog */}
      <div className="relative w-full max-w-md mx-4 bg-[#2a2a2a] rounded-3xl p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#3a3a3a] flex items-center justify-center">
            <Download className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-medium text-white">Import playlist</h2>
          <p className="text-sm text-gray-400 text-center">
            Paste a YouTube Music or YouTube playlist URL to import all songs
          </p>
        </div>

        {/* Input */}
        <div className="space-y-2">
          <Input
            value={playlistUrl}
            onChange={(e) => {
              setPlaylistUrl(e.target.value)
              setError("")
            }}
            placeholder="https://music.youtube.com/playlist?list=..."
            className="bg-transparent border-0 border-b border-[#4a4a4a] rounded-none px-0 text-white placeholder:text-gray-500 focus-visible:ring-0 focus-visible:border-primary"
            autoFocus
            disabled={isImporting}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <Button
            variant="ghost"
            onClick={handleCancel}
            disabled={isImporting}
            className="text-primary hover:text-primary hover:bg-primary/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!playlistUrl.trim() || isImporting}
            className="text-primary hover:text-primary hover:bg-primary/10 disabled:text-gray-600"
            variant="ghost"
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              "Import"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
