"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Loader2, Music } from "lucide-react"
import { useMusicPlayer } from "@/components/music-player-provider"

interface LyricsViewerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LyricsViewer({ open, onOpenChange }: LyricsViewerProps) {
  const { currentVideo } = useMusicPlayer()
  const [lyrics, setLyrics] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !currentVideo) return

    const fetchLyrics = async () => {
      setLoading(true)
      setError(null)
      setLyrics(null)

      try {
        console.log("[v0] Fetching lyrics for:", currentVideo.title)
        const response = await fetch(
          `/api/lyrics?title=${encodeURIComponent(currentVideo.title)}&artist=${encodeURIComponent(currentVideo.artist)}`,
        )

        if (!response.ok) {
          throw new Error("Failed to fetch lyrics")
        }

        const data = await response.json()

        if (data.lyrics) {
          setLyrics(data.lyrics)
        } else {
          setError("Lyrics not found for this song")
        }
      } catch (err) {
        console.error("[v0] Error fetching lyrics:", err)
        setError("Unable to load lyrics")
      } finally {
        setLoading(false)
      }
    }

    fetchLyrics()
  }, [open, currentVideo])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] flex flex-col">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle>Lyrics</SheetTitle>
          {currentVideo && (
            <div className="text-sm text-muted-foreground">
              {currentVideo.title} • {currentVideo.artist}
            </div>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {loading && (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">Loading lyrics...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Music className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No Lyrics Available</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          )}

          {lyrics && (
            <div className="px-4">
              <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed text-foreground">{lyrics}</pre>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
