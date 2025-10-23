"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Sliders, Download, Shuffle } from "lucide-react"
import { audioSettingsStorage, type AudioSettings } from "@/lib/audio-settings-storage"

interface AudioSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenOfflineDownloads?: () => void
  onOpenCrossfade?: () => void
}

const PRESETS: Array<{ label: string; value: AudioSettings["preset"] }> = [
  { label: "Off", value: "off" },
  { label: "Bass Boost", value: "bass-boost" },
  { label: "Vocal", value: "vocal" },
  { label: "Rock", value: "rock" },
  { label: "Jazz", value: "jazz" },
  { label: "Classical", value: "classical" },
  { label: "Electronic", value: "electronic" },
  { label: "Custom", value: "custom" },
]

export function AudioSettingsDialog({
  open,
  onOpenChange,
  onOpenOfflineDownloads,
  onOpenCrossfade,
}: AudioSettingsDialogProps) {
  const [settings, setSettings] = useState<AudioSettings>(audioSettingsStorage.getSettings())

  useEffect(() => {
    const handleSettingsChange = () => {
      setSettings(audioSettingsStorage.getSettings())
    }

    window.addEventListener("audioSettingsChanged", handleSettingsChange)
    return () => window.removeEventListener("audioSettingsChanged", handleSettingsChange)
  }, [])

  const handlePresetChange = (preset: AudioSettings["preset"]) => {
    const newSettings: AudioSettings = {
      ...settings,
      preset,
      customEQ: preset === "custom" ? settings.customEQ : audioSettingsStorage.getPresetEQ(preset),
    }
    setSettings(newSettings)
    audioSettingsStorage.saveSettings(newSettings)
  }

  const handleCustomEQChange = (type: keyof AudioSettings["customEQ"], value: number) => {
    const newSettings: AudioSettings = {
      ...settings,
      preset: "custom",
      customEQ: {
        ...settings.customEQ,
        [type]: value,
      },
    }
    setSettings(newSettings)
    audioSettingsStorage.saveSettings(newSettings)
  }

  const handleNormalizationChange = (checked: boolean) => {
    const newSettings: AudioSettings = {
      ...settings,
      normalization: checked,
    }
    setSettings(newSettings)
    audioSettingsStorage.saveSettings(newSettings)
  }

  const currentEQ = settings.preset === "custom" ? settings.customEQ : audioSettingsStorage.getPresetEQ(settings.preset)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sliders className="w-5 h-5" />
            Audio Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Equalizer Preset</Label>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((preset) => (
                <Button
                  key={preset.value}
                  variant={settings.preset === preset.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePresetChange(preset.value)}
                  className="justify-start"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-semibold">Equalizer</Label>

            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Bass</Label>
                  <span className="text-xs text-muted-foreground">
                    {currentEQ.bass > 0 ? "+" : ""}
                    {currentEQ.bass} dB
                  </span>
                </div>
                <Slider
                  value={[currentEQ.bass]}
                  min={-12}
                  max={12}
                  step={1}
                  onValueChange={(value) => handleCustomEQChange("bass", value[0])}
                  disabled={settings.preset !== "custom"}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Mid</Label>
                  <span className="text-xs text-muted-foreground">
                    {currentEQ.mid > 0 ? "+" : ""}
                    {currentEQ.mid} dB
                  </span>
                </div>
                <Slider
                  value={[currentEQ.mid]}
                  min={-12}
                  max={12}
                  step={1}
                  onValueChange={(value) => handleCustomEQChange("mid", value[0])}
                  disabled={settings.preset !== "custom"}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Treble</Label>
                  <span className="text-xs text-muted-foreground">
                    {currentEQ.treble > 0 ? "+" : ""}
                    {currentEQ.treble} dB
                  </span>
                </div>
                <Slider
                  value={[currentEQ.treble]}
                  min={-12}
                  max={12}
                  step={1}
                  onValueChange={(value) => handleCustomEQChange("treble", value[0])}
                  disabled={settings.preset !== "custom"}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Audio Normalization</Label>
              <p className="text-xs text-muted-foreground">Balance volume across tracks</p>
            </div>
            <Switch checked={settings.normalization} onCheckedChange={handleNormalizationChange} />
          </div>

          <div className="space-y-2 pt-2 border-t">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 bg-transparent"
              onClick={() => {
                onOpenChange(false)
                onOpenCrossfade?.()
              }}
            >
              <Shuffle className="w-4 h-4" />
              Crossfade Settings
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2 bg-transparent"
              onClick={() => {
                onOpenChange(false)
                onOpenOfflineDownloads?.()
              }}
            >
              <Download className="w-4 h-4" />
              Offline Downloads
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">Audio settings apply to all playback</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
