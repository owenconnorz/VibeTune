"use client"

import { ArrowLeft, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useState, useEffect } from "react"

export default function PlayerSettingsPage() {
  const router = useRouter()
  const [equalizerEnabled, setEqualizerEnabled] = useState(false)
  const [bass, setBass] = useState([0])
  const [mid, setMid] = useState([0])
  const [treble, setTreble] = useState([0])
  const [crossfade, setCrossfade] = useState(false)
  const [gapless, setGapless] = useState(true)
  const [normalizeVolume, setNormalizeVolume] = useState(false)

  useEffect(() => {
    // Load settings from localStorage
    const settings = localStorage.getItem("playerSettings")
    if (settings) {
      const parsed = JSON.parse(settings)
      setEqualizerEnabled(parsed.equalizerEnabled ?? false)
      setBass(parsed.bass ?? [0])
      setMid(parsed.mid ?? [0])
      setTreble(parsed.treble ?? [0])
      setCrossfade(parsed.crossfade ?? false)
      setGapless(parsed.gapless ?? true)
      setNormalizeVolume(parsed.normalizeVolume ?? false)
    }
  }, [])

  const saveSettings = (updates: any) => {
    const current = {
      equalizerEnabled,
      bass,
      mid,
      treble,
      crossfade,
      gapless,
      normalizeVolume,
      ...updates,
    }
    localStorage.setItem("playerSettings", JSON.stringify(current))
    console.log("[v0] Player settings saved:", current)
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
              <p className="text-sm text-muted-foreground">Adjust audio frequencies</p>
            </div>
            <Switch
              checked={equalizerEnabled}
              onCheckedChange={(checked) => {
                setEqualizerEnabled(checked)
                saveSettings({ equalizerEnabled: checked })
              }}
            />
          </div>

          {equalizerEnabled && (
            <div className="bg-card rounded-2xl p-6 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Bass</Label>
                  <span className="text-sm text-muted-foreground">
                    {bass[0] > 0 ? "+" : ""}
                    {bass[0]} dB
                  </span>
                </div>
                <Slider
                  value={bass}
                  onValueChange={(value) => {
                    setBass(value)
                    saveSettings({ bass: value })
                  }}
                  min={-12}
                  max={12}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Mid</Label>
                  <span className="text-sm text-muted-foreground">
                    {mid[0] > 0 ? "+" : ""}
                    {mid[0]} dB
                  </span>
                </div>
                <Slider
                  value={mid}
                  onValueChange={(value) => {
                    setMid(value)
                    saveSettings({ mid: value })
                  }}
                  min={-12}
                  max={12}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Treble</Label>
                  <span className="text-sm text-muted-foreground">
                    {treble[0] > 0 ? "+" : ""}
                    {treble[0]} dB
                  </span>
                </div>
                <Slider
                  value={treble}
                  onValueChange={(value) => {
                    setTreble(value)
                    saveSettings({ treble: value })
                  }}
                  min={-12}
                  max={12}
                  step={1}
                  className="w-full"
                />
              </div>

              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => {
                  setBass([0])
                  setMid([0])
                  setTreble([0])
                  saveSettings({ bass: [0], mid: [0], treble: [0] })
                }}
              >
                Reset to default
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
                  saveSettings({ crossfade: checked })
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
                  saveSettings({ gapless: checked })
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
                  saveSettings({ normalizeVolume: checked })
                }}
              />
            </div>
          </div>
        </div>

        {/* Audio Quality */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Audio quality</h2>
          <div className="bg-card rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">High quality</p>
                <p className="text-sm text-muted-foreground">Best available quality</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
