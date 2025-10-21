"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { savePlaylist } from "@/lib/playlist-storage"

interface CreatePlaylistDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPlaylistCreated?: () => void
}

export function CreatePlaylistDialog({ open, onOpenChange, onPlaylistCreated }: CreatePlaylistDialogProps) {
  const [playlistName, setPlaylistName] = useState("")
  const [syncEnabled, setSyncEnabled] = useState(false)

  const handleCreate = () => {
    if (!playlistName.trim()) return

    savePlaylist({
      name: playlistName,
      description: syncEnabled ? "Synced with YouTube Music" : undefined,
      videos: [],
    })

    setPlaylistName("")
    setSyncEnabled(false)
    onOpenChange(false)
    onPlaylistCreated?.()
  }

  const handleCancel = () => {
    setPlaylistName("")
    setSyncEnabled(false)
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
            <Plus className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-medium text-white">Create playlist</h2>
        </div>

        {/* Input */}
        <Input
          value={playlistName}
          onChange={(e) => setPlaylistName(e.target.value)}
          placeholder="Playlist name"
          className="bg-transparent border-0 border-b border-[#4a4a4a] rounded-none px-0 text-white placeholder:text-gray-500 focus-visible:ring-0 focus-visible:border-primary"
          autoFocus
        />

        {/* Sync Toggle */}
        <div className="flex items-start justify-between gap-4 py-4">
          <div className="flex-1">
            <h3 className="text-white font-medium mb-1">Sync playlist</h3>
            <p className="text-sm text-gray-400">
              Note: This allows for syncing with YouTube Music. This is NOT changeable later.
            </p>
          </div>
          <Switch checked={syncEnabled} onCheckedChange={setSyncEnabled} className="data-[state=checked]:bg-primary" />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pt-4">
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="text-primary hover:text-primary hover:bg-primary/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!playlistName.trim()}
            className="text-primary hover:text-primary hover:bg-primary/10 disabled:text-gray-600"
            variant="ghost"
          >
            OK
          </Button>
        </div>
      </div>
    </div>
  )
}
