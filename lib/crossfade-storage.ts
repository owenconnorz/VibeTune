const STORAGE_KEY = "vibetune_crossfade_settings"

export interface CrossfadeSettings {
  enabled: boolean
  duration: number // in seconds (0-12)
}

const DEFAULT_SETTINGS: CrossfadeSettings = {
  enabled: false,
  duration: 5,
}

export const crossfadeStorage = {
  getSettings(): CrossfadeSettings {
    if (typeof window === "undefined") return DEFAULT_SETTINGS

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  },

  saveSettings(settings: CrossfadeSettings): void {
    if (typeof window === "undefined") return

    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    window.dispatchEvent(new Event("crossfadeSettingsChanged"))
  },
}
