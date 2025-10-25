"use client"

import { ArrowLeft, Volume2, Music2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useState, useEffect } from "react"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { audioEqualizer, EQUALIZER_BANDS, EQUALIZER_PRESETS } from "@/lib/audio-equalizer"

export default function PlayerSettingsPage() {
  const router = useRouter()
  const [equalizerEnabled, setEqualizerEnabled] = useState(false)
  const [gains, setGains] = useState<number[]>(Array(10).fill(0))
  const [selectedPreset, setSelectedPreset] = useState("Flat")
  const [crossfade, setCrossfade] = useState(false)
  const [gapless, setGapless] = useState(true)
  const [normalizeVolume, setNormalizeVolume] = useState(false)
  const [audioQuality, setAudioQuality] = useState<"auto" | "high" | "low">("high")
  const [qualitySheetOpen, setQualitySheetOpen] = useState(false)
  const [presetSheetOpen, setPresetSheetOpen] = useState(false)

  useEffect(() => {
    // Load equalizer settings
    const eqSettings = localStorage.getItem("equalizerSettings")
    if (eqSettings) {
      const parsed = JSON.parse(eqSettings)
      setEqualizerEnabled(parsed.enabled ?? false)
      setGains(parsed.gains ?? Array(10).fill(0))
      setSelectedPreset(parsed.preset ?? "Flat")
    }

    // Load player settings
    const settings = localStorage.getItem("playerSettings")
    if (settings) {
      const parsed = JSON.parse(settings)
      setCrossfade(parsed.crossfade ?? false)
      setGapless(parsed.gapless ?? true)
      setNormalizeVolume(parsed.normalizeVolume ?? false)
      setAudioQuality(parsed.audioQuality ?? "high")
    }
  }, [])

  const saveEqualizerSettings = (updates: any) => {
    const current = {
      enabled: equalizerEnabled,
      gains,
      preset: selectedPreset,
      ...updates,
    }
    localStorage.setItem("equalizerSettings", JSON.stringify(current))
    console.log("[v0] Equalizer settings saved:", current)
  }

  const savePlayerSettings = (updates: any) => {
    const current = {
      crossfade,
      gapless,
      normalizeVolume,
      audioQuality,
      ...updates,
    }
    localStorage.setItem("playerSettings", JSON.stringify(current))
    console.log("[v0] Player settings saved:", current)
  }

  const handleEqualizerToggle = (checked: boolean) => {
    setEqualizerEnabled(checked)
    audioEqualizer.setEnabled(checked)
    if (!checked) {
      audioEqualizer.reset()
    } else {
      audioEqualizer.setAllGains(gains)
    }
    saveEqualizerSettings({ enabled: checked })
  }

  const handleGainChange = (index: number, value: number[]) => {
    const newGains = [...gains]
    newGains[index] = value[0]
    setGains(newGains)
    setSelectedPreset("Custom")

    if (equalizerEnabled) {
      audioEqualizer.setGain(index, value[0])
    }

    saveEqualizerSettings({ gains: newGains, preset: "Custom" })
  }

  const handlePresetSelect = (presetName: string) => {
    const preset = EQUALIZER_PRESETS.find((p) => p.name === presetName)
    if (preset) {
      setGains(preset.gains)
      setSelectedPreset(preset.name)

      if (equalizerEnabled) {
        audioEqualizer.setAllGains(preset.gains)
      }

      saveEqualizerSettings({ gains: preset.gains, preset: preset.name })
      setPresetSheetOpen(false)
    }
  }

  const handleReset = () => {
    const flatGains = Array(10).fill(0)
    setGains(flatGains)
    setSelectedPreset("Flat")

    if (equalizerEnabled) {
      audioEqualizer.setAllGains(flatGains)
    }

    saveEqualizerSettings({ gains: flatGains, preset: "Flat" })
  }

  const getQualityLabel = (quality: string) => {
    switch (quality) {
      case "auto":
        return "Auto"
      case "high":
        return "High"
      case "low":
        return "Low"
      default:
        return "High"
    }
  }

  const getQualityDescription = (quality: string) => {
    switch (quality) {
      case "auto":
        return "Adapts to your connection"
      case "high":
        return "Best available quality"
      case "low":
        return "Saves data usage"
      default:
        return "Best available quality"
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
            <h1 className="text-2xl font-bold">Player and audio</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-8 max-w-2xl pb-32">
        {/* Equalizer Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Equalizer</h2>
              <p className="text-sm text-muted-foreground">10-band graphic equalizer</p>
            </div>
            <Switch checked={equalizerEnabled} onCheckedChange={handleEqualizerToggle} />
          </div>

          {equalizerEnabled && (
            <div className="bg-card rounded-2xl p-6 space-y-6">
              {/* Preset Selector */}
              <button
                onClick={() => setPresetSheetOpen(true)}
                className="w-full bg-accent/50 rounded-xl p-4 text-left hover:bg-accent/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Music2 className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{selectedPreset}</p>
                    <p className="text-sm text-muted-foreground">Tap to change preset</p>
                  </div>
                </div>
              </button>

              {/* 10-Band Equalizer */}
              <div className="space-y-4">
                {EQUALIZER_BANDS.map((band, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">
                        {band.frequency >= 1000 ? `${band.frequency / 1000}kHz` : `${band.frequency}Hz`}
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        {gains[index] > 0 ? "+" : ""}
                        {gains[index]} dB
                      </span>
                    </div>
                    <Slider
                      value={[gains[index]]}
                      onValueChange={(value) => handleGainChange(index, value)}
                      min={-12}
                      max={12}
                      step={1}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>

              <Button variant="outline" className="w-full bg-transparent" onClick={handleReset}>
                Reset to flat
              </Button>
            </div>
          )}
        </div>

        {/* Playback Settings */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Playback</h2>

          <div className="bg-card rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Crossfade</Label>
                <p className="text-sm text-muted-foreground">Smooth transitions between songs</p>
              </div>
              <Switch
                checked={crossfade}
                onCheckedChange={(checked) => {
                  setCrossfade(checked)
                  savePlayerSettings({ crossfade: checked })
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Gapless playback</Label>
                <p className="text-sm text-muted-foreground">No silence between tracks</p>
              </div>
              <Switch
                checked={gapless}
                onCheckedChange={(checked) => {
                  setGapless(checked)
                  savePlayerSettings({ gapless: checked })
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Normalize volume</Label>
                <p className="text-sm text-muted-foreground">Keep volume consistent</p>
              </div>
              <Switch
                checked={normalizeVolume}
                onCheckedChange={(checked) => {
                  setNormalizeVolume(checked)
                  savePlayerSettings({ normalizeVolume: checked })
                }}
              />
            </div>
          </div>
        </div>

        {/* Audio Quality */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Audio quality</h2>
          <button
            onClick={() => setQualitySheetOpen(true)}
            className="w-full bg-card rounded-2xl p-4 text-left hover:bg-card/80 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{getQualityLabel(audioQuality)}</p>
                <p className="text-sm text-muted-foreground">{getQualityDescription(audioQuality)}</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Preset Selection Sheet */}
      <Sheet open={presetSheetOpen} onOpenChange={setPresetSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <div className="py-4">
            <h3 className="text-lg font-semibold mb-4">Equalizer Presets</h3>
            <div className="space-y-2">
              {EQUALIZER_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handlePresetSelect(preset.name)}
                  className={`w-full p-4 rounded-xl text-left transition-colors ${
                    selectedPreset === preset.name
                      ? "bg-primary text-primary-foreground"
                      : "bg-accent/50 hover:bg-accent"
                  }`}
                >
                  <p className="font-medium">{preset.name}</p>
                </button>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Audio Quality Selection Sheet */}
      <Sheet open={qualitySheetOpen} onOpenChange={setQualitySheetOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <div className="py-4">
            <RadioGroup
              value={audioQuality}
              onValueChange={(value: "auto" | "high" | "low") => {
                setAudioQuality(value)
                savePlayerSettings({ audioQuality: value })
                setQualitySheetOpen(false)
              }}
              className="space-y-4"
            >
              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="auto" id="auto" />
                <Label htmlFor="auto" className="flex-1 cursor-pointer text-base">
                  Auto
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="high" id="high" />
                <Label htmlFor="high" className="flex-1 cursor-pointer text-base">
                  High
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="low" id="low" />
                <Label htmlFor="low" className="flex-1 cursor-pointer text-base">
                  Low
                </Label>
              </div>
            </RadioGroup>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
