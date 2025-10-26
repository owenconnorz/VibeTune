"use client"
import { Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { useMusicPlayer } from "@/components/music-player-provider"
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll"
import { ProgressiveImage } from "@/components/progressive-image"
import { isDownloaded } from "@/lib/download-storage"
import { DownloadIndicatorBadge } from "@/components/download-indicator-badge"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface HomeFeedSectionProps {
  section: {
    title: string
    type?: string
    items: Array<{
      id: string
      title: string
      artist: string
      thumbnail: string
      duration: string
      type?: string
      aspectRatio?: string
    }>
    continuation?: string | null
    query?: string
  }
  sectionIndex: number
  onLoadMore: (sectionIndex: number) => Promise<void>
  additionalItems: any[]
  continuationToken: string | null | undefined
  isLoadingMore: boolean
}

export function HomeFeedSection({
  section,
  sectionIndex,
  onLoadMore,
  additionalItems,
  continuationToken,
  isLoadingMore,
}: HomeFeedSectionProps) {
  const { playVideo } = useMusicPlayer()
  const router = useRouter()
  const allItems = [...section.items, ...additionalItems]
  const hasContinuation = continuationToken !== undefined ? continuationToken : section.continuation

  const [downloadedStates, setDownloadedStates] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const checkDownloadedStates = async () => {
      if (allItems.length === 0) return

      const downloadStates: Record<string, boolean> = {}
      for (const item of allItems) {
        downloadStates[item.id] = await isDownloaded(item.id)
      }
      setDownloadedStates(downloadStates)
    }
    checkDownloadedStates()
  }, [section.items, additionalItems])

  const loadMoreRef = useInfiniteScroll({
    onLoadMore: () => onLoadMore(sectionIndex),
    hasMore: !!hasContinuation,
    isLoading: isLoadingMore,
  })

  const handleItemClick = (item: any, itemIndex: number) => {
    const itemType = item.type || "song"

    // Navigate to appropriate page for playlists, albums, and artists
    if (itemType === "playlist") {
      // Remove "VL" prefix if present for playlist IDs
      const playlistId = item.id.startsWith("VL") ? item.id.substring(2) : item.id
      router.push(`/dashboard/playlist/${playlistId}`)
      return
    }

    if (itemType === "album") {
      router.push(`/dashboard/playlist/${item.id}`)
      return
    }

    if (itemType === "artist") {
      router.push(`/dashboard/artist/${item.id}`)
      return
    }

    // For songs, play directly with queue
    const remainingSongs = allItems.slice(itemIndex + 1, 20).map((s) => ({
      id: s.id,
      title: s.title,
      artist: s.artist,
      thumbnail: s.thumbnail,
    }))
    playVideo({ id: item.id, title: item.title, artist: item.artist, thumbnail: item.thumbnail }, remainingSongs)
  }

  return (
    <div className="px-4 space-y-4">
      <h2 className="text-2xl font-bold">{section.title}</h2>
      {section.type === "list" || sectionIndex === 0 ? (
        <div className="space-y-3">
          {allItems.slice(0, 20).map((song, songIndex) => (
            <div
              key={song.id}
              className="flex items-center gap-3 group cursor-pointer"
              onClick={() => handleItemClick(song, songIndex)}
            >
              <div className="relative w-14 h-14 flex-shrink-0">
                <ProgressiveImage src={song.thumbnail || "/placeholder.svg"} alt={song.title} rounded="lg" />
                <DownloadIndicatorBadge isDownloaded={downloadedStates[song.id]} size="sm" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                  <Play className="w-6 h-6 fill-white text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{song.title}</h3>
                <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
              </div>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                  />
                </svg>
              </Button>
            </div>
          ))}
          {hasContinuation && allItems.length >= 20 && (
            <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
              {isLoadingMore && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Loading more...</span>
                </div>
              )}
            </div>
          )}
        </div>
      ) : section.type === "immersive" ? (
        <>
          <ScrollArea className="w-full">
            <div className="flex gap-4 pb-4">
              {allItems.map((item, itemIndex) => (
                <div
                  key={item.id}
                  className="w-72 flex-shrink-0 cursor-pointer group"
                  onClick={() => handleItemClick(item, itemIndex)}
                >
                  <div className="relative aspect-video mb-3">
                    <ProgressiveImage src={item.thumbnail || "/placeholder.svg"} alt={item.title} rounded="lg" />
                    <DownloadIndicatorBadge isDownloaded={downloadedStates[item.id]} size="md" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                      <Play className="w-12 h-12 fill-white text-white" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-base truncate">{item.title}</h3>
                  {item.artist && <p className="text-sm text-muted-foreground truncate">{item.artist}</p>}
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
          {hasContinuation && (
            <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
              {isLoadingMore && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Loading more...</span>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          <ScrollArea className="w-full">
            <div className="flex gap-3 pb-4">
              {allItems.map((item, itemIndex) => {
                const isVideo = item.aspectRatio === "video"
                const cardWidth = isVideo ? "w-56" : "w-40"

                return (
                  <div
                    key={item.id}
                    className={`${cardWidth} flex-shrink-0 cursor-pointer group`}
                    onClick={() => handleItemClick(item, itemIndex)}
                  >
                    <div className={`relative ${isVideo ? "aspect-video" : "aspect-square"} mb-2`}>
                      <ProgressiveImage src={item.thumbnail || "/placeholder.svg"} alt={item.title} rounded="lg" />
                      <DownloadIndicatorBadge isDownloaded={downloadedStates[item.id]} size="sm" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                        <Play className="w-8 h-8 fill-white text-white" />
                      </div>
                    </div>
                    <h3 className="font-semibold text-sm truncate">{item.title}</h3>
                    <p className="text-xs text-muted-foreground truncate">{item.artist}</p>
                  </div>
                )
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
          {hasContinuation && (
            <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
              {isLoadingMore && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Loading more...</span>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
