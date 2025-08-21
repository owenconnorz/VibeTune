"use client"
import { useState, useEffect } from "react"
import { ArrowLeft, HardDrive, Trash2, Download, Database, RefreshCw, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { useRouter } from "next/navigation"
import { useDownload } from "@/contexts/download-context"

export default function StorageSettingsPage() {
  const router = useRouter()
  const { downloadedSongs, clearAllDownloads } = useDownload()

  const [storageInfo, setStorageInfo] = useState({
    totalUsed: 0,
    cacheSize: 0,
    downloadedSize: 0,
    thumbnailCache: 0,
    audioCache: 0,
  })

  const [storageSettings, setStorageSettings] = useState({
    autoCleanCache: true,
    maxCacheSize: 500, // MB
    downloadQuality: "high",
    offlineMode: false,
  })

  const [isClearing, setIsClearing] = useState(false)

  useEffect(() => {
    calculateStorageUsage()
    loadStorageSettings()
  }, [])

  const calculateStorageUsage = async () => {
    try {
      // Estimate storage usage
      const downloadedSize = downloadedSongs.length * 4 // Rough estimate: 4MB per song
      const cacheSize = Math.floor(Math.random() * 100) + 50 // Simulated cache size
      const thumbnailCache = Math.floor(Math.random() * 20) + 10 // Simulated thumbnail cache
      const audioCache = Math.floor(Math.random() * 200) + 100 // Simulated audio cache

      setStorageInfo({
        totalUsed: downloadedSize + cacheSize + thumbnailCache + audioCache,
        cacheSize,
        downloadedSize,
        thumbnailCache,
        audioCache,
      })
    } catch (error) {
      console.error("Failed to calculate storage usage:", error)
    }
  }

  const loadStorageSettings = () => {
    try {
      const saved = localStorage.getItem("vibetuneStorageSettings")
      if (saved) {
        setStorageSettings(JSON.parse(saved))
      }
    } catch (error) {
      console.error("Failed to load storage settings:", error)
    }
  }

  const saveStorageSettings = (newSettings: typeof storageSettings) => {
    setStorageSettings(newSettings)
    localStorage.setItem("vibetuneStorageSettings", JSON.stringify(newSettings))
  }

  const handleClearCache = async () => {
    setIsClearing(true)
    try {
      // Clear various caches
      if ("caches" in window) {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map((name) => caches.delete(name)))
      }

      // Clear localStorage items related to cache
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes("cache") || key.includes("thumbnail"))) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key))

      // Recalculate storage
      await calculateStorageUsage()
    } catch (error) {
      console.error("Failed to clear cache:", error)
    } finally {
      setIsClearing(false)
    }
  }

  const handleClearDownloads = async () => {
    try {
      await clearAllDownloads()
      await calculateStorageUsage()
    } catch (error) {
      console.error("Failed to clear downloads:", error)
    }
  }

  const formatSize = (sizeInMB: number) => {
    if (sizeInMB < 1) return `${Math.round(sizeInMB * 1024)} KB`
    if (sizeInMB < 1024) return `${Math.round(sizeInMB)} MB`
    return `${(sizeInMB / 1024).toFixed(1)} GB`
  }

  const storagePercentage = Math.min((storageInfo.totalUsed / 1000) * 100, 100)

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <header className="flex items-center p-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-300 hover:text-white mr-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-2xl font-semibold text-white">Storage</h1>
      </header>

      <div className="px-4 pb-6 space-y-6">
        {/* Storage Usage Overview */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <HardDrive className="w-5 h-5" />
              Storage Usage
            </CardTitle>
            <CardDescription className="text-gray-400">Current storage usage breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-white font-medium">Total Used</span>
                <span className="text-gray-400">{formatSize(storageInfo.totalUsed)}</span>
              </div>
              <Progress value={storagePercentage} className="h-2" />
              <p className="text-xs text-gray-400">{storagePercentage.toFixed(1)}% of estimated 1GB limit</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-700">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-gray-300">Downloaded Songs</span>
                </div>
                <p className="text-white font-semibold">{formatSize(storageInfo.downloadedSize)}</p>
                <p className="text-xs text-gray-400">{downloadedSongs.length} songs</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-300">Cache</span>
                </div>
                <p className="text-white font-semibold">{formatSize(storageInfo.cacheSize)}</p>
                <p className="text-xs text-gray-400">Temporary files</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-400 rounded"></div>
                  <span className="text-sm text-gray-300">Thumbnails</span>
                </div>
                <p className="text-white font-semibold">{formatSize(storageInfo.thumbnailCache)}</p>
                <p className="text-xs text-gray-400">Album artwork</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-400 rounded"></div>
                  <span className="text-sm text-gray-300">Audio Cache</span>
                </div>
                <p className="text-white font-semibold">{formatSize(storageInfo.audioCache)}</p>
                <p className="text-xs text-gray-400">Buffered audio</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Storage Management */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white">Storage Management</CardTitle>
            <CardDescription className="text-gray-400">Clean up and manage your storage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-zinc-700 rounded-lg">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-white font-medium">Clear Cache</p>
                  <p className="text-gray-400 text-sm">Remove temporary files and thumbnails</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearCache}
                disabled={isClearing}
                className="bg-zinc-600 border-zinc-500 text-white hover:bg-zinc-500"
              >
                {isClearing ? "Clearing..." : "Clear"}
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-zinc-700 rounded-lg">
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-white font-medium">Clear Downloads</p>
                  <p className="text-gray-400 text-sm">Remove all downloaded songs</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearDownloads}
                disabled={downloadedSongs.length === 0}
                className="bg-red-600 border-red-500 text-white hover:bg-red-500"
              >
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Storage Settings */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white">Storage Settings</CardTitle>
            <CardDescription className="text-gray-400">Configure automatic storage management</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-700 rounded-lg flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Auto-clean Cache</p>
                  <p className="text-gray-400 text-sm">Automatically clear old cache files</p>
                </div>
              </div>
              <Switch
                checked={storageSettings.autoCleanCache}
                onCheckedChange={(checked) => saveStorageSettings({ ...storageSettings, autoCleanCache: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-700 rounded-lg flex items-center justify-center">
                  <Database className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Offline Mode</p>
                  <p className="text-gray-400 text-sm">Only play downloaded content</p>
                </div>
              </div>
              <Switch
                checked={storageSettings.offlineMode}
                onCheckedChange={(checked) => saveStorageSettings({ ...storageSettings, offlineMode: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Storage Tips */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              Storage Tips
            </CardTitle>
            <CardDescription className="text-gray-400">Ways to optimize your storage usage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm text-gray-300 space-y-2">
              <p>• Downloaded songs use the most storage space</p>
              <p>• Cache files help improve performance but can be cleared safely</p>
              <p>• Thumbnails are automatically cached for faster loading</p>
              <p>• Enable auto-clean to automatically manage storage</p>
              <p>• Consider downloading only your favorite songs</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
