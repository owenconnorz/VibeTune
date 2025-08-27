"use client"

import { useSettings } from "@/contexts/settings-context"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export function AdultContentToggle() {
  const { adultContentEnabled, setAdultContentEnabled, isAgeVerified } = useSettings()

  return (
    <div className="flex items-center space-x-2">
      <Switch id="adult-content" checked={adultContentEnabled} onCheckedChange={setAdultContentEnabled} />
      <Label htmlFor="adult-content" className="text-sm font-medium">
        Enable Adult Content
        {!isAgeVerified && adultContentEnabled && (
          <span className="text-xs text-gray-500 block">(Age verification required)</span>
        )}
      </Label>
    </div>
  )
}
