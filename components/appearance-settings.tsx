"use client"

import type React from "react"

import { ArrowLeft, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { themeStorage } from "@/lib/theme-storage"
import { useSession } from "next-auth/react"

export function AppearanceSettings() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [dynamicTheme, setDynamicTheme] = useState(false)
  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  const [hasCustomPicture, setHasCustomPicture] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: session } = useSession()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    try {
      const settings = themeStorage.getSettings()
      setDynamicTheme(settings.dynamicThemeEnabled)

      const customPicture = localStorage.getItem("customProfilePicture")
      if (customPicture) {
        setProfilePicture(customPicture)
        setHasCustomPicture(true)
      } else if (session?.user?.image) {
        setProfilePicture(session.user.image)
        setHasCustomPicture(false)
      }
    } catch (error) {
      console.error("[v0] Error loading appearance settings:", error)
    }
  }, [mounted, session])

  const handleToggleDynamicTheme = () => {
    try {
      const newValue = themeStorage.toggleDynamicTheme()
      setDynamicTheme(newValue)
      window.dispatchEvent(new CustomEvent("themeSettingsChanged"))
    } catch (error) {
      console.error("[v0] Error toggling dynamic theme:", error)
    }
  }

  const handleProfilePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target?.[0]
    if (!file) return

    try {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB")
        return
      }

      if (!file.type.startsWith("image/")) {
        alert("Please select an image file")
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        try {
          const base64String = reader.result as string
          setProfilePicture(base64String)
          setHasCustomPicture(true)
          localStorage.setItem("customProfilePicture", base64String)
          window.dispatchEvent(new CustomEvent("profilePictureChanged", { detail: base64String }))
        } catch (error) {
          console.error("[v0] Error saving profile picture:", error)
          alert("Failed to save profile picture. Please try again.")
        }
      }
      reader.onerror = () => {
        console.error("[v0] Error reading file")
        alert("Failed to read file. Please try again.")
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("[v0] Error handling profile picture change:", error)
    }
  }

  const handleRemoveProfilePicture = () => {
    try {
      localStorage.removeItem("customProfilePicture")
      setProfilePicture(session?.user?.image || null)
      setHasCustomPicture(false)
      window.dispatchEvent(new CustomEvent("profilePictureChanged", { detail: session?.user?.image || null }))
    } catch (error) {
      console.error("[v0] Error removing profile picture:", error)
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 bg-background z-30 border-b border-border/50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="w-6 h-6" />
              </Button>
              <h1 className="text-2xl font-bold">Appearance</h1>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-6 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  const user = session?.user

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background z-30 border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-2xl font-bold">Appearance</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6 max-w-2xl">
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground px-2">Profile</h2>
          <div className="bg-card rounded-2xl p-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profilePicture || user?.image || ""} alt={user?.name || "User"} />
                  <AvatarFallback className="text-3xl">{user?.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors"
                >
                  <Camera className="w-4 h-4 text-primary-foreground" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="hidden"
                />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{user?.name || "Guest"}</h3>
                <p className="text-sm text-muted-foreground mb-3">{user?.email || "guest@opentune.app"}</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-full"
                  >
                    Change Picture
                  </Button>
                  {hasCustomPicture && (
                    <Button variant="ghost" size="sm" onClick={handleRemoveProfilePicture} className="rounded-full">
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Upload a custom profile picture. Maximum file size: 5MB. Supported formats: JPG, PNG, GIF, WebP.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground px-2">Theme</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-card rounded-2xl p-4">
              <div className="flex-1">
                <h3 className="font-semibold">Dynamic Theme</h3>
                <p className="text-sm text-muted-foreground mt-1">Change background colors based on album artwork</p>
              </div>
              <Switch checked={dynamicTheme} onCheckedChange={handleToggleDynamicTheme} />
            </div>

            <div className="bg-card rounded-2xl p-4">
              <p className="text-sm text-muted-foreground">
                When enabled, the app background will adapt to match the colors of the currently playing song's artwork,
                creating a more immersive listening experience.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
