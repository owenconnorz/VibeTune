"use client"
import { useState } from "react"
import { ArrowLeft, Globe, Music, Link, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export default function ContentSettingsPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [autoSync, setAutoSync] = useState(false)

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
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Music className="w-5 h-5 text-yellow-400" />
              Offline Music Library
            </CardTitle>
            <CardDescription className="text-gray-400">
              Your music is powered by our curated offline database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-300 space-y-2">
              <p>• High-quality curated music collection</p>
              <p>• No internet connection required for playback</p>
              <p>• Intelligent search across genres and artists</p>
              <p>• Trending and popular music recommendations</p>
              <p>• Fast and reliable music discovery</p>
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
                  <p className="text-gray-400 text-sm">Automatically update your custom playlists</p>
                </div>
              </div>
              <Switch checked={autoSync} onCheckedChange={handleAutoSyncToggle} />
            </div>

            <div className="text-xs text-gray-400 space-y-1 pt-2 border-t border-zinc-700">
              <p>• Auto-sync keeps your custom playlists organized</p>
              <p>• Changes to your playlists are saved automatically</p>
              <p>• Works entirely offline with local storage</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white">Music Sources</CardTitle>
            <CardDescription className="text-gray-400">How your music library is powered</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-zinc-700 rounded-lg">
              <div className="flex items-center gap-3">
                <Music className="w-6 h-6 text-yellow-400" />
                <div>
                  <p className="text-white font-medium">Offline Database</p>
                  <p className="text-gray-400 text-sm">Curated music collection</p>
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
            <CardDescription className="text-gray-400">Important information about your music library</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm text-gray-300 space-y-2">
              <p>• All music is provided through our curated offline database</p>
              <p>• Content is carefully selected for quality and variety</p>
              <p>• No external dependencies or internet required</p>
              <p>• Fast search and discovery across all genres</p>
              <p>• Regular updates to expand the music collection</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
