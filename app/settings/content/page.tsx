"use client"
import { useState } from "react"
import { ArrowLeft, Globe, Link } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useRouter } from "next/navigation"

export default function ContentSettingsPage() {
  const router = useRouter()
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
              <p>• Syncs with YouTube API for latest content</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
