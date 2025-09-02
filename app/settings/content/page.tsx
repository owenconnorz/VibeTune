"use client"
import { useState, useEffect } from "react"
import { ArrowLeft, Globe, Link, Server } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"

export default function ContentSettingsPage() {
  const router = useRouter()
  const [autoSync, setAutoSync] = useState(false)
  const [selectedPipedInstance, setSelectedPipedInstance] = useState("pipedapi.kavin.rocks")

  const pipedInstances = [
    { value: "pipedapi.kavin.rocks", label: "Kavin Rocks (Default)", url: "https://pipedapi.kavin.rocks" },
    { value: "api.piped.video", label: "Piped Video", url: "https://api.piped.video" },
    { value: "pipedapi.adminforge.de", label: "AdminForge", url: "https://pipedapi.adminforge.de" },
    { value: "api.piped.privacydev.net", label: "Privacy Dev", url: "https://api.piped.privacydev.net" },
    { value: "pipedapi.palveluntarjoaja.eu", label: "Palveluntarjoaja", url: "https://pipedapi.palveluntarjoaja.eu" },
    { value: "api-piped.mha.fi", label: "MHA Finland", url: "https://api-piped.mha.fi" },
    { value: "piped-api.garudalinux.org", label: "Garuda Linux", url: "https://piped-api.garudalinux.org" },
  ]

  useEffect(() => {
    const savedInstance = localStorage.getItem("vibetunePipedInstance")
    if (savedInstance) {
      setSelectedPipedInstance(savedInstance)
    }
  }, [])

  const handleAutoSyncToggle = (enabled: boolean) => {
    setAutoSync(enabled)
    localStorage.setItem("vibetuneAutoSync", enabled.toString())
  }

  const handlePipedInstanceChange = (instanceValue: string) => {
    setSelectedPipedInstance(instanceValue)
    localStorage.setItem("vibetunePipedInstance", instanceValue)
    console.log("[v0] Piped instance changed to:", instanceValue)
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
        {/* Piped Instance Selection Card */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Server className="w-5 h-5" />
              Piped Instance
            </CardTitle>
            <CardDescription className="text-gray-400">
              Select which Piped server to use for music streaming
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-700 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Server Instance</p>
                  <p className="text-gray-400 text-sm">Choose your preferred Piped API server</p>
                </div>
              </div>
              <Select value={selectedPipedInstance} onValueChange={handlePipedInstanceChange}>
                <SelectTrigger className="w-48 bg-zinc-700 border-zinc-600 text-white">
                  <SelectValue placeholder="Select instance" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-700 border-zinc-600">
                  {pipedInstances.map((instance) => (
                    <SelectItem key={instance.value} value={instance.value} className="text-white hover:bg-zinc-600">
                      {instance.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-xs text-gray-400 space-y-1 pt-2 border-t border-zinc-700">
              <p>• Piped provides privacy-focused YouTube access</p>
              <p>• Different instances may have varying performance</p>
              <p>• Switch instances if one becomes unavailable</p>
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
              <p>• Syncs with YouTube API for latest content</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
