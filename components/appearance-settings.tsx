"use client"

import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { themeStorage } from "@/lib/theme-storage"

export function AppearanceSettings() {
  const router = useRouter()
  const [dynamicTheme, setDynamicTheme] = useState(false)

  useEffect(() => {
    const settings = themeStorage.getSettings()
    setDynamicTheme(settings.dynamicThemeEnabled)
  }, [])

  const handleToggleDynamicTheme = () => {
    const newValue = themeStorage.toggleDynamicTheme()
    setDynamicTheme(newValue)

    // Trigger a custom event to notify other components
    window.dispatchEvent(new CustomEvent("themeSettingsChanged"))
  }

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
  )
}
