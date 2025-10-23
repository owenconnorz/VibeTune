const STORAGE_KEY = "vibetune_audio_settings"

export interface AudioSettings {
  preset: "off" | "bass-boost" | "vocal" | "rock" | "jazz" | "classical" | "electronic" | "custom"
  customEQ: {
    bass: number // -12 to +12 dB
    mid: number
    treble: number
  }
  normalization: boolean
}

const DEFAULT_SETTINGS: AudioSettings = {
  preset: "off",
  customEQ: {
    bass: 0,
    mid: 0,
    treble: 0,
  },
  normalization: false,
}

export const audioSettingsStorage = {
  getSettings(): AudioSettings {
    if (typeof window === "undefined") {
      return DEFAULT_SETTINGS
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return DEFAULT_SETTINGS

      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
    } catch {
      return DEFAULT_SETTINGS
    }
  },

  saveSettings(settings: AudioSettings): void {
    if (typeof window === "undefined") return

    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    window.dispatchEvent(new Event("audioSettingsChanged"))
  },

  getPresetEQ(preset: AudioSettings["preset"]): AudioSettings["customEQ"] {
    switch (preset) {
      case "bass-boost":
        return { bass: 8, mid: 0, treble: -2 }
      case "vocal":
        return { bass: -2, mid: 6, treble: 2 }
      case "rock":
        return { bass: 6, mid: 2, treble: 4 }
      case "jazz":
        return { bass: 4, mid: 2, treble: 4 }
      case "classical":
        return { bass: 2, mid: -2, treble: 4 }
      case "electronic":
        return { bass: 8, mid: -2, treble: 6 }
      default:
        return { bass: 0, mid: 0, treble: 0 }
    }
  },
}
