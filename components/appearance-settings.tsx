"use client"

import { ArrowLeft, Sun, Moon, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { themeStorage, type ThemeMode } from "@/lib/theme-storage"
import { sliderStyleStorage, type SliderStyle } from "@/lib/slider-style-storage"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function AppearanceSettings() {
  const router = useRouter()
  const [dynamicTheme, setDynamicTheme] = useState(false)
  const [themeMode, setThemeMode] = useState<ThemeMode>("system")
  const [sliderStyle, setSliderStyle] = useState<SliderStyle>("default")
  const [sliderDialogOpen, setSliderDialogOpen] = useState(false)
  const [themeModeDialogOpen, setThemeModeDialogOpen] = useState(false)

  useEffect(() => {
    const settings = themeStorage.getSettings()
    setDynamicTheme(settings.dynamicThemeEnabled)
    setThemeMode(settings.mode)
    setSliderStyle(sliderStyleStorage.getStyle())
  }, [])

  const handleToggleDynamicTheme = () => {
    const newValue = themeStorage.toggleDynamicTheme()
    setDynamicTheme(newValue)

    // Trigger a custom event to notify other components
    window.dispatchEvent(new CustomEvent("themeSettingsChanged"))
  }

  const handleThemeModeChange = (mode: ThemeMode) => {
    themeStorage.setThemeMode(mode)
    setThemeMode(mode)
    setThemeModeDialogOpen(false)
  }

  const handleSliderStyleChange = (style: SliderStyle) => {
    sliderStyleStorage.setStyle(style)
    setSliderStyle(style)
    setSliderDialogOpen(false)
  }

  const getSliderStyleName = (style: SliderStyle) => {
    switch (style) {
      case "default":
        return "Default"
      case "squiggly":
        return "Squiggly"
      case "slim":
        return "Slim"
    }
  }

  const getThemeModeName = (mode: ThemeMode) => {
    switch (mode) {
      case "light":
        return "Light"
      case "dark":
        return "Dark"
      case "system":
        return "System"
    }
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
          <button
            onClick={() => setThemeModeDialogOpen(true)}
            className="w-full flex items-center justify-between bg-card rounded-2xl p-4 hover:bg-card/80 transition-colors"
          >
            <div className="flex-1 text-left">
              <h3 className="font-semibold">Theme</h3>
              <p className="text-sm text-muted-foreground mt-1">{getThemeModeName(themeMode)}</p>
            </div>
          </button>

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

          <button
            onClick={() => setSliderDialogOpen(true)}
            className="w-full flex items-center justify-between bg-card rounded-2xl p-4 hover:bg-card/80 transition-colors"
          >
            <div className="flex-1 text-left">
              <h3 className="font-semibold">Player slider style</h3>
              <p className="text-sm text-muted-foreground mt-1">{getSliderStyleName(sliderStyle)}</p>
            </div>
          </button>
        </div>
      </div>

      <Dialog open={themeModeDialogOpen} onOpenChange={setThemeModeDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-lg border-border/50">
          <DialogHeader>
            <DialogTitle className="text-center">Theme</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3 py-4">
            <button
              onClick={() => handleThemeModeChange("light")}
              className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                themeMode === "light" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
              }`}
            >
              <Sun className="w-8 h-8" />
              <span className="text-sm font-medium">Light</span>
            </button>

            <button
              onClick={() => handleThemeModeChange("dark")}
              className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                themeMode === "dark" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
              }`}
            >
              <Moon className="w-8 h-8" />
              <span className="text-sm font-medium">Dark</span>
            </button>

            <button
              onClick={() => handleThemeModeChange("system")}
              className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                themeMode === "system" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
              }`}
            >
              <Monitor className="w-8 h-8" />
              <span className="text-sm font-medium">System</span>
            </button>
          </div>
          <Button variant="ghost" onClick={() => setThemeModeDialogOpen(false)} className="w-full">
            Cancel
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={sliderDialogOpen} onOpenChange={setSliderDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-lg border-border/50">
          <DialogHeader>
            <DialogTitle className="text-center">Player slider style</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3 py-4">
            <button
              onClick={() => handleSliderStyleChange("default")}
              className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                sliderStyle === "default" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
              }`}
            >
              <div className="w-full h-12 flex items-center justify-center">
                <svg width="40" height="24" viewBox="0 0 40 24" fill="none" className="text-foreground">
                  <rect x="0" y="10" width="40" height="4" rx="2" fill="currentColor" opacity="0.3" />
                  <rect x="0" y="10" width="24" height="4" rx="2" fill="currentColor" />
                  <circle cx="24" cy="12" r="6" fill="currentColor" />
                </svg>
              </div>
              <span className="text-sm font-medium">Default</span>
            </button>

            <button
              onClick={() => handleSliderStyleChange("squiggly")}
              className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                sliderStyle === "squiggly" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
              }`}
            >
              <div className="w-full h-12 flex items-center justify-center">
                <svg width="40" height="24" viewBox="0 0 40 24" fill="none" className="text-foreground">
                  <path
                    d="M0 12 Q5 8, 10 12 T20 12 T30 12 T40 12"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    opacity="0.3"
                  />
                  <path d="M0 12 Q5 8, 10 12 T20 12" stroke="currentColor" strokeWidth="3" fill="none" />
                  <circle cx="20" cy="12" r="6" fill="currentColor" />
                </svg>
              </div>
              <span className="text-sm font-medium">Squiggly</span>
            </button>

            <button
              onClick={() => handleSliderStyleChange("slim")}
              className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                sliderStyle === "slim" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
              }`}
            >
              <div className="w-full h-12 flex items-center justify-center">
                <svg width="40" height="24" viewBox="0 0 40 24" fill="none" className="text-foreground">
                  <rect x="0" y="11" width="40" height="2" rx="1" fill="currentColor" opacity="0.3" />
                  <rect x="0" y="11" width="24" height="2" rx="1" fill="currentColor" />
                  <circle cx="24" cy="12" r="5" fill="currentColor" />
                </svg>
              </div>
              <span className="text-sm font-medium">Slim</span>
            </button>
          </div>
          <Button variant="ghost" onClick={() => setSliderDialogOpen(false)} className="w-full">
            Cancel
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
