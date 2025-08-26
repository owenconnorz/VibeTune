"use client"
import { useState } from "react"
import { ArrowLeft, Globe, Youtube, Download, Link, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { usePlaylist } from "@/contexts/playlist-context"
import { createYouTubeMusicAPI } from "@/lib/youtube-music-api"

export default function ContentSettingsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { createPlaylist } = usePlaylist()

  const [playlistUrl, setPlaylistUrl] = useState("")
  const [isImporting, setIsImporting] = useState(false)
  const [importStatus, setImportStatus] = useState<string | null>(null)
  const [autoSync, setAutoSync] = useState(false)

  const handlePlaylistImport = async () => {
    if (!playlistUrl.trim()) {
      setImportStatus("Please enter a valid YouTube playlist URL")
      return
    }

    if (!user) {
      setImportStatus("Please sign in to import playlists")
      return
    }

    setIsImporting(true)
    setImportStatus("Importing playlist...")

    try {
      const youtubeAPI = createYouTubeMusicAPI()
      const playlistId = extractPlaylistId(playlistUrl)

      if (!playlistId) {
        throw new Error("Invalid YouTube playlist URL")
      }

      const result = await youtubeAPI.getPlaylist(playlistId)

      if (result && result.title && result.songs) {
        const songs = result.songs.map((song: any) => ({
          id: song.id,
          title: song.title,
          artist: song.artist || "Unknown Artist",
          thumbnail: song.thumbnail,
          duration: song.duration || "0:00",
        }))

        await createPlaylist(result.title, songs, result.thumbnail)

        setImportStatus(`Successfully imported "${result.title}" with ${songs.length} songs`)
        setPlaylistUrl("")
      } else {
        throw new Error("Failed to fetch playlist data")
      }
    } catch (error) {
      console.error("Playlist import failed:", error)
      setImportStatus(`Import failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsImporting(false)
    }
  }

  const extractPlaylistId = (url: string): string | null => {
    const regex = /[?&]list=([^#&?]*)/
    const match = url.match(regex)
    return match ? match[1] : null
  }

  const handleAutoSyncToggle = (enabled: boolean) => {
    setAutoSync(enabled)
    localStorage.setItem("vibetuneAutoSync", enabled.toString())
  }

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
        <h1 className="text-2xl font-semibold text-white">Content</h1>
      </header>

      <div className="px-4 pb-6 space-y-6">
        {/* YouTube Import Section */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Youtube className="w-5 h-5 text-red-500" />
              Import from YouTube
            </CardTitle>
            <CardDescription className="text-gray-400">Import playlists directly from YouTube</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">YouTube Playlist URL</label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://www.youtube.com/playlist?list=..."
                  value={playlistUrl}
                  onChange={(e) => setPlaylistUrl(e.target.value)}
                  className="bg-zinc-700 border-zinc-600 text-white placeholder-gray-400"
                  disabled={isImporting}
                />
                <Button
                  onClick={handlePlaylistImport}
                  disabled={isImporting || !playlistUrl.trim()}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {isImporting ? "Importing..." : "Import"}
                </Button>
              </div>
            </div>

            {importStatus && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  importStatus.includes("Successfully")
                    ? "bg-green-900/50 text-green-300 border border-green-700"
                    : "bg-red-900/50 text-red-300 border border-red-700"
                }`}
              >
                {importStatus}
              </div>
            )}

            <div className="text-xs text-gray-400 space-y-1">
              <p>• Paste any YouTube playlist URL to import all songs</p>
              <p>• Private playlists require you to be signed in</p>
              <p>• Large playlists may take a few moments to import</p>
            </div>
          </CardContent>
        </Card>

        {/* Content Sync Settings */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Sync Settings
            </CardTitle>
            <CardDescription className="text-gray-400">Configure how content is synchronized</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-700 rounded-lg flex items-center justify-center">
                  <Link className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Auto-sync Playlists</p>
                  <p className="text-gray-400 text-sm">Automatically update imported playlists</p>
                </div>
              </div>
              <Switch checked={autoSync} onCheckedChange={handleAutoSyncToggle} />
            </div>

            <div className="text-xs text-gray-400 space-y-1 pt-2 border-t border-zinc-700">
              <p>• Auto-sync keeps your imported playlists up to date</p>
              <p>• Changes from YouTube will be reflected in your library</p>
              <p>• Requires internet connection to sync</p>
            </div>
          </CardContent>
        </Card>

        {/* Content Sources */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white">Supported Sources</CardTitle>
            <CardDescription className="text-gray-400">Platforms you can import content from</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-zinc-700 rounded-lg">
              <div className="flex items-center gap-3">
                <Youtube className="w-6 h-6 text-red-500" />
                <div>
                  <p className="text-white font-medium">YouTube</p>
                  <p className="text-gray-400 text-sm">Import playlists and porn</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400 text-sm">Active</span>
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-zinc-700/50 rounded-lg opacity-60">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">S</span>
                </div>
                <div>
                  <p className="text-white font-medium">Spotify</p>
                  <p className="text-gray-400 text-sm">Coming soon</p>
                </div>
              </div>
              <span className="text-gray-500 text-sm">Soon</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-zinc-700/50 rounded-lg opacity-60">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">SC</span>
                </div>
                <div>
                  <p className="text-white font-medium">SoundCloud</p>
                  <p className="text-gray-400 text-sm">Coming soon</p>
                </div>
              </div>
              <span className="text-gray-500 text-sm">Soon</span>
            </div>
          </CardContent>
        </Card>

        {/* Content Guidelines */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white">Content Guidelines</CardTitle>
            <CardDescription className="text-gray-400">Important information about imported content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm text-gray-300 space-y-2">
              <p>• Only import content you have permission to use</p>
              <p>• Respect copyright and intellectual property rights</p>
              <p>• Some content may not be available in all regions</p>
              <p>• Content quality depends on the original source</p>
              <p>• We don't store or redistribute copyrighted material</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
