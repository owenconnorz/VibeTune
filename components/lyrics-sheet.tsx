"use client"

import { useState, useEffect, useRef } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useMusicPlayer } from "@/components/music-player-provider"
import { Music2, Loader2 } from "lucide-react"

interface LyricsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface LyricsData {
  lyrics: string[] | null
  synced: boolean
  timestamps?: number[]
}

export function LyricsSheet({ open, onOpenChange }: LyricsSheetProps) {
  const { currentVideo, currentTime } = useMusicPlayer()
  const [lyricsData, setLyricsData] = useState<LyricsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const lineRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    if (!currentVideo || !open) return

    const fetchLyrics = async () => {
      setLoading(true)
      try {
        // Create a search query from title and artist
        const query = `${currentVideo.artist}/${currentVideo.title.split("(")[0].trim()}`
        const response = await fetch(`/api/lyrics/${encodeURIComponent(query)}`)
        const data = await response.json()
        setLyricsData(data)
      } catch (error) {
        console.error("[v0] Error fetching lyrics:", error)
        setLyricsData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchLyrics()
  }, [currentVideo, open])

  // Auto-scroll to current line
  useEffect(() => {
    if (!lyricsData?.synced || !lyricsData.timestamps) return

    const currentIndex = lyricsData.timestamps.findIndex((timestamp, index) => {
      const nextTimestamp = lyricsData.timestamps?.[index + 1]
      return currentTime >= timestamp && (!nextTimestamp || currentTime < nextTimestamp)
    })

    if (currentIndex !== -1 && currentIndex !== currentLineIndex) {
      setCurrentLineIndex(currentIndex)

      // Scroll to current line
      const currentLineElement = lineRefs.current[currentIndex]
      if (currentLineElement && scrollAreaRef.current) {
        currentLineElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        })
      }
    }
  }, [currentTime, lyricsData, currentLineIndex])

  if (!currentVideo) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="text-2xl">Lyrics</SheetTitle>
          <div className="text-sm text-muted-foreground">
            <p className="font-medium">{currentVideo.title}</p>
            <p>{currentVideo.artist}</p>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 py-4" ref={scrollAreaRef}>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Loading lyrics...</p>
            </div>
          ) : !lyricsData?.lyrics || lyricsData.lyrics.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Music2 className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No lyrics available</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Lyrics for this song couldn't be found. They may not be available yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4 pb-8">
              {lyricsData.lyrics.map((line, index) => {
                const isCurrentLine = lyricsData.synced && index === currentLineIndex
                const isPastLine = lyricsData.synced && index < currentLineIndex

                return (
                  <div
                    key={index}
                    ref={(el) => (lineRefs.current[index] = el)}
                    className={`transition-all duration-300 ${
                      isCurrentLine
                        ? "text-2xl font-bold text-primary scale-105"
                        : isPastLine
                          ? "text-lg text-muted-foreground/60"
                          : "text-lg text-foreground"
                    }`}
                  >
                    {line}
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {lyricsData?.synced && (
          <div className="px-6 py-3 border-t bg-muted/30">
            <p className="text-xs text-center text-muted-foreground">
              Synced lyrics • Tap any line to jump to that moment
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
