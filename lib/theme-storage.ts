const THEME_STORAGE_KEY = "vibetune_dynamic_theme"
const THEME_MODE_KEY = "vibetune_theme_mode"

export type ThemeMode = "light" | "dark" | "system"

export interface ThemeSettings {
  dynamicThemeEnabled: boolean
  mode: ThemeMode
}

export const themeStorage = {
  getSettings(): ThemeSettings {
    if (typeof window === "undefined") {
      return { dynamicThemeEnabled: false, mode: "system" }
    }

    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY)
      const modeStored = localStorage.getItem(THEME_MODE_KEY)

      return {
        dynamicThemeEnabled: stored ? JSON.parse(stored).dynamicThemeEnabled : false,
        mode: (modeStored as ThemeMode) || "system",
      }
    } catch (error) {
      console.error("[v0] Error reading theme settings:", error)
    }

    return { dynamicThemeEnabled: false, mode: "system" }
  },

  saveSettings(settings: ThemeSettings): void {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ dynamicThemeEnabled: settings.dynamicThemeEnabled }))
      localStorage.setItem(THEME_MODE_KEY, settings.mode)
    } catch (error) {
      console.error("[v0] Error saving theme settings:", error)
    }
  },

  toggleDynamicTheme(): boolean {
    const settings = this.getSettings()
    const newValue = !settings.dynamicThemeEnabled
    this.saveSettings({ ...settings, dynamicThemeEnabled: newValue })
    return newValue
  },

  setThemeMode(mode: ThemeMode): void {
    const settings = this.getSettings()
    this.saveSettings({ ...settings, mode })
    this.applyTheme(mode)
  },

  applyTheme(mode: ThemeMode): void {
    if (typeof window === "undefined") return

    const root = document.documentElement

    if (mode === "system") {
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      root.classList.toggle("dark", systemPrefersDark)
    } else {
      root.classList.toggle("dark", mode === "dark")
    }
  },

  initTheme(): void {
    const settings = this.getSettings()
    this.applyTheme(settings.mode)
  },
}
