"use client"
import { useEffect, useState, useCallback, useMemo } from "react"
import { ArrowLeft, User, Globe, Play, HardDrive, Shield, RefreshCw, Info, Palette, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useSettings } from "@/contexts/settings-context"

export default function SettingsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { adultContentEnabled, setAdultContentEnabled } = useSettings()

  const [profileSettings, setProfileSettings] = useState({
    useCustomPicture: false,
    customPictureUrl: null as string | null,
  })

  const settingsCategories = useMemo(
    () => [
      {
        id: "appearance",
        title: "Appearance",
        icon: Palette,
        description: "Theme, display, and visual settings",
      },
      {
        id: "account",
        title: "Account",
        icon: User,
        description: "Google account and profile settings",
      },
      {
        id: "content",
        title: "Content",
        icon: Globe,
        description: "YouTube import and sync settings",
      },
      {
        id: "player",
        title: "Player and audio",
        icon: Play,
        description: "Music playback and audio preferences",
      },
      {
        id: "storage",
        title: "Storage",
        icon: HardDrive,
        description: "Cache and local storage management",
      },
      {
        id: "privacy",
        title: "Privacy",
        icon: Shield,
        description: "Data privacy and security settings",
      },
      {
        id: "backup",
        title: "Backup and restore",
        icon: RefreshCw,
        description: "Sync and backup your music data",
      },
      {
        id: "about",
        title: "About",
        icon: Info,
        description: "App information and support",
      },
    ],
    [],
  )

  useEffect(() => {
    const loadProfileSettings = () => {
      try {
        const saved = localStorage.getItem("vibetuneProfileSettings")
        if (saved) {
          setProfileSettings(JSON.parse(saved))
        }
      } catch (error) {
        console.error("Failed to load profile settings:", error)
      }
    }

    const timeoutId = setTimeout(loadProfileSettings, 0)
    return () => clearTimeout(timeoutId)
  }, [])

  const handleCategoryClick = useCallback(
    (categoryId: string) => {
      router.push(`/settings/${categoryId}`)
    },
    [router],
  )

  const handleBack = useCallback(() => {
    router.back()
  }, [router])

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <header className="flex items-center p-4">
        <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white mr-4" onClick={handleBack}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
      </header>

      <div className="px-4 pb-6">
        <div className="flex flex-col items-center py-8 mb-8">
          <div className="relative mb-4">
            <Avatar className="w-24 h-24 border-4 border-yellow-400">
              <AvatarImage
                src={
                  profileSettings.useCustomPicture && profileSettings.customPictureUrl
                    ? profileSettings.customPictureUrl
                    : user?.picture || "/diverse-profile-avatars.png"
                }
              />
              <AvatarFallback className="text-2xl bg-zinc-700">{user?.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
          </div>
          <h2 className="text-xl font-semibold text-white mb-1">{user?.name || "Guest User"}</h2>
          {user?.email && <p className="text-gray-400 text-sm">{user.email}</p>}
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between p-4 hover:bg-zinc-800/50 rounded-lg transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-gray-400" />
              </div>
              <div className="text-left">
                <p className="text-white font-medium text-lg">18+ Content</p>
                <p className="text-gray-400 text-sm">Show adult content in videos section</p>
              </div>
            </div>
            <Switch
              checked={adultContentEnabled}
              onCheckedChange={setAdultContentEnabled}
              className="data-[state=checked]:bg-yellow-600"
            />
          </div>
        </div>

        <div className="space-y-1">
          {settingsCategories.map((category) => {
            const IconComponent = category.icon
            return (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 flex items-center justify-center">
                    <IconComponent className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium text-lg">{category.title}</p>
                    <p className="text-gray-400 text-sm">{category.description}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-gray-300 transition-colors" />
              </button>
            )
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">VibeTune Music App</p>
          <p className="text-gray-600 text-xs mt-1">Version 1.0.0</p>
        </div>
      </div>
    </div>
  )
}
