"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Shuffle } from "lucide-react"
import { crossfadeStorage, type CrossfadeSettings } from "@/lib/crossfade-storage"

interface CrossfadeSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CrossfadeSettingsDialog({ open, onOpenChange }: CrossfadeSettingsDialogProps) {
  const [settings, setSettings] = useState<CrossfadeSettings>(crossfadeStorage.getSettings())

  useEffect(() => {
    const handleSettingsChange = () => {
      setSettings(crossfadeStorage.getSettings())
    }

    window.addEventListener("crossfadeSettingsChanged", handleSettingsChange)
    return () => window.removeEventListener("crossfadeSettingsChanged", handleSettingsChange)
  }, [])

  const handleEnabledChange = (enabled: boolean) => {
    const newSettings = { ...settings, enabled }
    setSettings(newSettings)
    crossfadeStorage.saveSettings(newSettings)
  }

  const handleDurationChange = (value: number) => {
    const newSettings = { ...settings, duration: value }
    setSettings(newSettings)
    crossfadeStorage.saveSettings(newSettings)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shuffle className="w-5 h-5" />
            Crossfade
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Enable Crossfade</Label>
              <p className="text-xs text-muted-foreground">Seamlessly blend songs together</p>
            </div>
            <Switch checked={settings.enabled} onCheckedChange={handleEnabledChange} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Crossfade Duration</Label>
              <span className="text-sm text-muted-foreground">{settings.duration}s</span>
            </div>
            <Slider
              value={[settings.duration]}
              min={0}
              max={12}
              step={1}
              onValueChange={(value) => handleDurationChange(value[0])}
              disabled={!settings.enabled}
            />
            <p className="text-xs text-muted-foreground">
              Songs will overlap for {settings.duration} seconds during transitions
            </p>
          </div>

          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <h4 className="text-sm font-semibold">How it works</h4>
            <p className="text-xs text-muted-foreground">
              Crossfade creates a smooth transition between songs by fading out the current track while fading in the
              next one. This eliminates silence between songs for a continuous listening experience.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
