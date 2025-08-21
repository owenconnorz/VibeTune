"use client"
import { useEffect, useState, useCallback } from "react"
import type React from "react"

import { ArrowLeft, Upload, Palette, Video, Music, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useAudioPlayer } from "@/contexts/audio-player-context"

export default function AppearanceSettingsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { state, setVideoMode } = useAudioPlayer()

  const [profileSettings, setProfileSettings] = useState({
    useCustomPicture: false,
    customPictureUrl: null as string | null,
  })

  const [canvasMode, setCanvasMode] = useState(false)

  const loadSettings = useCallback(() => {
    try {
      const savedProfile = localStorage.getItem("vibetuneProfileSettings")
      if (savedProfile) {
        setProfileSettings(JSON.parse(savedProfile))
      }

      const savedCanvas = localStorage.getItem("vibetuneCanvasMode") === "true"
      setCanvasMode(savedCanvas)
    } catch (error) {
      console.error("Failed to load appearance settings:", error)
    }
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const handleProfilePictureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB")
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        const newSettings = {
          useCustomPicture: true,
          customPictureUrl: result,
        }
        setProfileSettings(newSettings)
        localStorage.setItem("vibetuneProfileSettings", JSON.stringify(newSettings))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveCustomPicture = () => {
    const newSettings = {
      useCustomPicture: false,
      customPictureUrl: null,
    }
    setProfileSettings(newSettings)
    localStorage.setItem("vibetuneProfileSettings", JSON.stringify(newSettings))
  }

  const handleVideoModeToggle = (enabled: boolean) => {
    setVideoMode(enabled)
  }

  const handleCanvasModeToggle = (enabled: boolean) => {
    setCanvasMode(enabled)
    localStorage.setItem("vibetuneCanvasMode", enabled.toString())
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
        <h1 className="text-2xl font-semibold text-white">Appearance</h1>
      </header>

      <div className="px-4 pb-6 space-y-6">
        {/* Profile Picture Section */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Profile Picture
            </CardTitle>
            <CardDescription className="text-gray-400">Customize your profile picture</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16 border-2 border-yellow-400">
                <AvatarImage
                  src={
                    profileSettings.useCustomPicture && profileSettings.customPictureUrl
                      ? profileSettings.customPictureUrl
                      : user?.picture || "/diverse-profile-avatars.png"
                  }
                />
                <AvatarFallback className="text-xl bg-zinc-700">{user?.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-white font-medium">{user?.name || "Guest User"}</p>
                <p className="text-gray-400 text-sm">
                  {profileSettings.useCustomPicture ? "Custom picture" : "Default picture"}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="bg-zinc-700 border-zinc-600 text-white hover:bg-zinc-600"
                onClick={() => document.getElementById("profile-upload")?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Picture
              </Button>

              {profileSettings.useCustomPicture && (
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-zinc-700 border-zinc-600 text-white hover:bg-zinc-600"
                  onClick={handleRemoveCustomPicture}
                >
                  Remove Custom
                </Button>
              )}
            </div>

            <input
              id="profile-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleProfilePictureUpload}
            />
          </CardContent>
        </Card>

        {/* Media Player Settings */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Video className="w-5 h-5" />
              Media Player
            </CardTitle>
            <CardDescription className="text-gray-400">Configure how media is displayed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-700 rounded-lg flex items-center justify-center">
                  {state.isVideoMode ? (
                    <Video className="w-5 h-5 text-blue-400" />
                  ) : (
                    <Music className="w-5 h-5 text-green-400" />
                  )}
                </div>
                <div>
                  <p className="text-white font-medium">Video Mode</p>
                  <p className="text-gray-400 text-sm">Show videos when available</p>
                </div>
              </div>
              <Switch checked={state.isVideoMode} onCheckedChange={handleVideoModeToggle} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-700 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Canvas Mode</p>
                  <p className="text-gray-400 text-sm">Animated backgrounds during playback</p>
                </div>
              </div>
              <Switch checked={canvasMode} onCheckedChange={handleCanvasModeToggle} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
