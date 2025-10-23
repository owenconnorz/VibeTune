"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2, Download } from "lucide-react"
import { savePlaylist } from "@/lib/playlist-storage"
import { useRouter } from "next/navigation"

interface ImportYouTubePlaylistDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportYouTubePlaylistDialog({ open, onOpenChange }: ImportYouTubePlaylistDialogProps) {
  const router = useRouter()
  const [url, setUrl] = useState("")
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState("")

  const extractPlaylistId = (url: string): string | null => {
    try {
      const urlObj = new URL(url)
      // Handle music.youtube.com/playlist?list=...
      if (urlObj.hostname.includes("youtube.com")) {
        return urlObj.searchParams.get("list")
      }
      return null
    } catch {
      return null
    }
  }

  const handleImport = async () => {
    setError("")
    const playlistId = extractPlaylistId(url)

    if (!playlistId) {
      setError("Invalid YouTube Music playlist URL")
      return
    }

    setIsImporting(true)
    console.log("[v0] Importing YouTube playlist:", playlistId)

    try {
      // Fetch playlist data from YouTube Music API
      const response = await fetch(`/api/music/playlist/${playlistId}`)

      if (!response.ok) {
        throw new Error("Failed to fetch playlist")
      }

      const data = await response.json()

      if (!data.videos || data.videos.length === 0) {
        throw new Error("Playlist is empty or not found")
      }

      // Save playlist locally
      const newPlaylist = savePlaylist({
        name: data.title || "Imported Playlist",
        videos: data.videos,
      })

      console.log("[v0] Playlist imported successfully:", newPlaylist.id)

      // Navigate to the new playlist
      router.push(`/dashboard/playlist/${newPlaylist.id}`)
      onOpenChange(false)
      setUrl("")
    } catch (err) {
      console.error("[v0] Error importing playlist:", err)
      setError(err instanceof Error ? err.message : "Failed to import playlist")
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import from YouTube Music</DialogTitle>
          <DialogDescription>Paste a YouTube Music playlist URL to import it to your library</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="playlist-url">Playlist URL</Label>
            <Input
              id="playlist-url"
              placeholder="https://music.youtube.com/playlist?list=..."
              value={url}
              onChange={(e) => {
                setUrl(e.target.value)
                setError("")
              }}
              disabled={isImporting}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="bg-muted rounded-lg p-3 text-sm text-muted-foreground">
            <p className="font-medium mb-1">How to get the URL:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Open YouTube Music</li>
              <li>Go to the playlist you want to import</li>
              <li>Copy the URL from your browser</li>
              <li>Paste it here</li>
            </ol>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isImporting}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={isImporting || !url.trim()}>
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Import
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
