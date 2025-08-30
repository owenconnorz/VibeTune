"use client"
import { useState, useEffect } from "react"
import { ArrowLeft, Play, Volume2, Repeat, Shuffle, SkipForward, Headphones, Wifi, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { useAudioPlayer } from "@/contexts/audio-player-context"
import { useSettings } from "@/contexts/settings-context"

export default function PlayerAudioSettingsPage() {
  const router = useRouter()
  const { state, setVolume } = useAudioPlayer()
  const { youtubeSettings, setYoutubeSettings } = useSettings()

  const safeYoutubeSettings = youtubeSettings || {
    highQualityAudio: false,
    preferOpus: false,
    adaptiveAudio: true,
    showVideos: true,
    preferVideos: false,
  }

  const safeSetYoutubeSettings = setYoutubeSettings
    ? (updates: Partial<typeof safeYoutubeSettings>) => {
        setYoutubeSettings({ ...safeYoutubeSettings, ...updates })
      }
    : () => {}

  const [audioSettings, setAudioSettings] = useState({
    autoplay: true,
    crossfade: false,
    gaplessPlayback: true,
    normalizeVolume: false,
    audioQuality: "high",
    bufferSize: "medium",
  })

  const [playbackSettings, setPlaybackSettings] = useState({
    repeatMode: "off", // off, one, all
    shuffleMode: false,
    skipSilence: false,
    fadeInOut: true,
  })

  useEffect(() => {
    // Load saved settings
    try {
      const savedAudio = localStorage.getItem("vibetuneAudioSettings")
      if (savedAudio) {
        setAudioSettings(JSON.parse(savedAudio))
      }

      const savedPlayback = localStorage.getItem("vibetunePlaybackSettings")
      if (savedPlayback) {
        setPlaybackSettings(JSON.parse(savedPlayback))
      }
    } catch (error) {
      console.error("Failed to load player settings:", error)
    }
  }, [])

  const saveAudioSettings = (newSettings: typeof audioSettings) => {
    setAudioSettings(newSettings)
    localStorage.setItem("vibetuneAudioSettings", JSON.stringify(newSettings))
  }

  const savePlaybackSettings = (newSettings: typeof playbackSettings) => {
    setPlaybackSettings(newSettings)
    localStorage.setItem("vibetunePlaybackSettings", JSON.stringify(newSettings))
  }

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0] / 100)
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
        <h1 className="text-2xl font-semibold text-white">Player and audio</h1>
      </header>

      <div className="px-4 pb-6 space-y-6">
        {/* YouTube API Quality Settings */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="w-5 h-5" />
              YouTube API Settings
            </CardTitle>
            <CardDescription className="text-gray-400">
              Configure YouTube streaming quality and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-700 rounded-lg flex items-center justify-center">
                  <Headphones className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-medium">High Quality Audio</p>
                  <p className="text-gray-400 text-sm">Prefer higher bitrate audio formats</p>
                </div>
              </div>
              <Switch
                checked={safeYoutubeSettings.highQualityAudio}
                onCheckedChange={(checked) => safeSetYoutubeSettings({ highQualityAudio: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-700 rounded-lg flex items-center justify-center">
                  <Headphones className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Prefer Opus Audio</p>
                  <p className="text-gray-400 text-sm">Use Opus format over AAC for better efficiency</p>
                </div>
              </div>
              <Switch
                checked={safeYoutubeSettings.preferOpus}
                onCheckedChange={(checked) => safeSetYoutubeSettings({ preferOpus: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-700 rounded-lg flex items-center justify-center">
                  <Wifi className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Adaptive Audio Quality</p>
                  <p className="text-gray-400 text-sm">Automatically adjust quality based on network</p>
                </div>
              </div>
              <Switch
                checked={safeYoutubeSettings.adaptiveAudio}
                onCheckedChange={(checked) => safeSetYoutubeSettings({ adaptiveAudio: checked })}
              />
            </div>

            <div className="text-xs text-gray-400 space-y-1 pt-2 border-t border-zinc-700">
              <p>• High quality audio uses more bandwidth but provides better sound</p>
              <p>• Opus format is more efficient than AAC at the same bitrate</p>
              <p>• Adaptive quality automatically adjusts based on your connection</p>
            </div>
          </CardContent>
        </Card>

        {/* Playback Settings */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Play className="w-5 h-5" />
              Playback
            </CardTitle>
            <CardDescription className="text-gray-400">Control how music plays</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-700 rounded-lg flex items-center justify-center">
                  <Play className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Autoplay</p>
                  <p className="text-gray-400 text-sm">Automatically play next song</p>
                </div>
              </div>
              <Switch
                checked={audioSettings.autoplay}
                onCheckedChange={(checked) => saveAudioSettings({ ...audioSettings, autoplay: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-700 rounded-lg flex items-center justify-center">
                  <Shuffle className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Shuffle Mode</p>
                  <p className="text-gray-400 text-sm">Play songs in random order</p>
                </div>
              </div>
              <Switch
                checked={playbackSettings.shuffleMode}
                onCheckedChange={(checked) => savePlaybackSettings({ ...playbackSettings, shuffleMode: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-700 rounded-lg flex items-center justify-center">
                  <Repeat className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Repeat Mode</p>
                  <p className="text-gray-400 text-sm">How to repeat songs</p>
                </div>
              </div>
              <Select
                value={playbackSettings.repeatMode}
                onValueChange={(value) => savePlaybackSettings({ ...playbackSettings, repeatMode: value })}
              >
                <SelectTrigger className="w-32 bg-zinc-700 border-zinc-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-700 border-zinc-600">
                  <SelectItem value="off">Off</SelectItem>
                  <SelectItem value="one">One</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Audio Settings */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Volume2 className="w-5 h-5" />
              Audio
            </CardTitle>
            <CardDescription className="text-gray-400">Configure audio quality and processing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-white font-medium">Volume</p>
                <span className="text-gray-400 text-sm">{Math.round(state.volume * 100)}%</span>
              </div>
              <Slider
                value={[state.volume * 100]}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                className="w-full"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Audio Quality</p>
                <p className="text-gray-400 text-sm">Higher quality uses more data</p>
              </div>
              <Select
                value={audioSettings.audioQuality}
                onValueChange={(value) => saveAudioSettings({ ...audioSettings, audioQuality: value })}
              >
                <SelectTrigger className="w-32 bg-zinc-700 border-zinc-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-700 border-zinc-600">
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="lossless">Lossless</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-700 rounded-lg flex items-center justify-center">
                  <Headphones className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Normalize Volume</p>
                  <p className="text-gray-400 text-sm">Keep consistent volume levels</p>
                </div>
              </div>
              <Switch
                checked={audioSettings.normalizeVolume}
                onCheckedChange={(checked) => saveAudioSettings({ ...audioSettings, normalizeVolume: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-700 rounded-lg flex items-center justify-center">
                  <SkipForward className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Gapless Playback</p>
                  <p className="text-gray-400 text-sm">No silence between tracks</p>
                </div>
              </div>
              <Switch
                checked={audioSettings.gaplessPlayback}
                onCheckedChange={(checked) => saveAudioSettings({ ...audioSettings, gaplessPlayback: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white">Advanced</CardTitle>
            <CardDescription className="text-gray-400">Advanced audio processing options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Buffer Size</p>
                <p className="text-gray-400 text-sm">Larger buffers reduce skipping</p>
              </div>
              <Select
                value={audioSettings.bufferSize}
                onValueChange={(value) => saveAudioSettings({ ...audioSettings, bufferSize: value })}
              >
                <SelectTrigger className="w-32 bg-zinc-700 border-zinc-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-700 border-zinc-600">
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Crossfade</p>
                <p className="text-gray-400 text-sm">Smooth transitions between songs</p>
              </div>
              <Switch
                checked={audioSettings.crossfade}
                onCheckedChange={(checked) => saveAudioSettings({ ...audioSettings, crossfade: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Skip Silence</p>
                <p className="text-gray-400 text-sm">Automatically skip silent parts</p>
              </div>
              <Switch
                checked={playbackSettings.skipSilence}
                onCheckedChange={(checked) => savePlaybackSettings({ ...playbackSettings, skipSilence: checked })}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
