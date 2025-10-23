"use client"

import { useState, useEffect } from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  getStorageStats,
  setMaxSongCache,
  setMaxImageCache,
  clearDownloads,
  clearSongCache,
  clearImageCache,
  formatCacheSize,
  getCacheSizeInMB,
  type CacheSize,
  type StorageStats,
} from "@/lib/storage-manager"

const CACHE_SIZE_OPTIONS: CacheSize[] = ["disable", "128", "256", "512", "1024", "2048", "4096", "8192", "unlimited"]

export function StorageSettings() {
  const router = useRouter()
  const [stats, setStats] = useState<StorageStats>(getStorageStats())
  const [songCacheDialogOpen, setSongCacheDialogOpen] = useState(false)
  const [imageCacheDialogOpen, setImageCacheDialogOpen] = useState(false)

  useEffect(() => {
    setStats(getStorageStats())
  }, [])

  const handleMaxSongCacheChange = (value: CacheSize) => {
    setMaxSongCache(value)
    setStats(getStorageStats())
    setSongCacheDialogOpen(false)
  }

  const handleMaxImageCacheChange = (value: CacheSize) => {
    setMaxImageCache(value)
    setStats(getStorageStats())
    setImageCacheDialogOpen(false)
  }

  const handleClearDownloads = () => {
    clearDownloads()
    setStats(getStorageStats())
  }

  const handleClearSongCache = () => {
    clearSongCache()
    setStats(getStorageStats())
  }

  const handleClearImageCache = () => {
    clearImageCache()
    setStats(getStorageStats())
  }

  const imageCacheMax = getCacheSizeInMB(stats.maxImageCache)
  const imageCachePercent = imageCacheMax === Number.POSITIVE_INFINITY ? 0 : (stats.imageCache / imageCacheMax) * 100

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background z-30 border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-2xl font-bold">Storage</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-8 max-w-2xl">
        {/* Downloaded Songs */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground px-2">DOWNLOADED SONGS</h2>
          <div className="space-y-4 bg-card rounded-2xl p-6">
            <p className="text-2xl font-medium">{stats.downloadedSongs} MB used</p>
            <button
              onClick={handleClearDownloads}
              className="text-foreground hover:text-foreground/80 transition-colors font-medium"
            >
              Clear all downloads
            </button>
          </div>
        </div>

        {/* Song Cache */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground px-2">SONG CACHE</h2>
          <div className="space-y-4 bg-card rounded-2xl p-6">
            <p className="text-2xl font-medium">{stats.songCache} MB used</p>

            <button onClick={() => setSongCacheDialogOpen(true)} className="w-full text-left space-y-1">
              <p className="text-sm text-muted-foreground">Max cache size</p>
              <p className="text-lg font-medium">{formatCacheSize(stats.maxSongCache)}</p>
            </button>

            <button
              onClick={handleClearSongCache}
              className="text-foreground hover:text-foreground/80 transition-colors font-medium"
            >
              Clear song cache
            </button>
          </div>
        </div>

        {/* Image Cache */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground px-2">IMAGE CACHE</h2>
          <div className="space-y-4 bg-card rounded-2xl p-6">
            <Progress value={imageCachePercent} className="h-1" />

            <p className="text-lg font-medium">
              {stats.imageCache} MB / {formatCacheSize(stats.maxImageCache)} used
            </p>

            <button onClick={() => setImageCacheDialogOpen(true)} className="w-full text-left space-y-1">
              <p className="text-sm text-muted-foreground">Max cache size</p>
              <p className="text-lg font-medium">{formatCacheSize(stats.maxImageCache)}</p>
            </button>

            <button
              onClick={handleClearImageCache}
              className="text-foreground hover:text-foreground/80 transition-colors font-medium"
            >
              Clear image cache
            </button>
          </div>
        </div>
      </div>

      {/* Song Cache Size Dialog */}
      <Dialog open={songCacheDialogOpen} onOpenChange={setSongCacheDialogOpen}>
        <DialogContent className="bg-card/95 backdrop-blur-lg border-border/50">
          <DialogHeader>
            <DialogTitle>Max song cache size</DialogTitle>
          </DialogHeader>
          <RadioGroup value={stats.maxSongCache} onValueChange={handleMaxSongCacheChange}>
            <div className="space-y-3">
              {CACHE_SIZE_OPTIONS.map((size) => (
                <div key={size} className="flex items-center space-x-3">
                  <RadioGroupItem value={size} id={`song-${size}`} />
                  <Label htmlFor={`song-${size}`} className="text-lg cursor-pointer flex-1">
                    {formatCacheSize(size)}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </DialogContent>
      </Dialog>

      {/* Image Cache Size Dialog */}
      <Dialog open={imageCacheDialogOpen} onOpenChange={setImageCacheDialogOpen}>
        <DialogContent className="bg-card/95 backdrop-blur-lg border-border/50">
          <DialogHeader>
            <DialogTitle>Max image cache size</DialogTitle>
          </DialogHeader>
          <RadioGroup value={stats.maxImageCache} onValueChange={handleMaxImageCacheChange}>
            <div className="space-y-3">
              {CACHE_SIZE_OPTIONS.map((size) => (
                <div key={size} className="flex items-center space-x-3">
                  <RadioGroupItem value={size} id={`image-${size}`} />
                  <Label htmlFor={`image-${size}`} className="text-lg cursor-pointer flex-1">
                    {formatCacheSize(size)}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </DialogContent>
      </Dialog>
    </div>
  )
}
