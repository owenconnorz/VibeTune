const THEME_STORAGE_KEY = "opentune_dynamic_theme"

export interface ThemeSettings {
  dynamicThemeEnabled: boolean
}

export const themeStorage = {
  getSettings(): ThemeSettings {
    if (typeof window === "undefined") {
      return { dynamicThemeEnabled: false }
    }

    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error("[v0] Error reading theme settings:", error)
    }

    return { dynamicThemeEnabled: false }
  },

  saveSettings(settings: ThemeSettings): void {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(settings))
    } catch (error) {
      console.error("[v0] Error saving theme settings:", error)
    }
  },

  toggleDynamicTheme(): boolean {
    const settings = this.getSettings()
    const newValue = !settings.dynamicThemeEnabled
    this.saveSettings({ dynamicThemeEnabled: newValue })
    return newValue
  },
}
