"use client"

import { useMusicPlayer } from "@/components/music-player-provider"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { ProgressiveImage } from "@/components/progressive-image"
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll"

interface Playlist {
  id: string
  title: string
  artist: string
  thumbnail: string
  duration: string
}

interface CategorySubcategoryProps {
  subcategory: {
    title: string
    playlists: Playlist[]
    continuation?: string | null
  }
  subcategoryIndex: number
  onLoadMore: (subcategoryIndex: number, continuation: string) => Promise<void>
  additionalPlaylists: Playlist[]
  continuationToken: string | null | undefined
  isLoadingMore: boolean
}

export function CategorySubcategory({
  subcategory,
  subcategoryIndex,
  onLoadMore,
  additionalPlaylists,
  continuationToken,
  isLoadingMore,
}: CategorySubcategoryProps) {
  const { playVideo } = useMusicPlayer()
  const allPlaylists = [...subcategory.playlists, ...additionalPlaylists]
  const hasContinuation = continuationToken !== undefined ? continuationToken : subcategory.continuation

  const loadMoreRef = useInfiniteScroll({
    onLoadMore: () => hasContinuation && onLoadMore(subcategoryIndex, hasContinuation),
    hasMore: !!hasContinuation,
    isLoading: isLoadingMore,
  })

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{subcategory.title}</h2>
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4">
          {allPlaylists.map((playlist) => (
            <div
              key={playlist.id}
              className="flex-shrink-0 w-40 cursor-pointer group"
              onClick={() => playVideo(playlist)}
            >
              <div className="relative aspect-square rounded-lg overflow-hidden mb-2">
                <ProgressiveImage src={playlist.thumbnail || "/placeholder.svg"} alt={playlist.title} rounded="lg" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                  <svg className="w-12 h-12 fill-white text-white" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
              <h3 className="font-semibold text-sm line-clamp-2 mb-1">{playlist.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-1">{playlist.artist}</p>
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
    </div>
  )
}
