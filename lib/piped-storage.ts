const PIPED_STORAGE_KEY = "opentune_piped_settings"

export const PIPED_INSTANCES = [
  { url: "https://pipedapi.kavin.rocks", name: "Official (kavin.rocks)", region: "Global" },
  { url: "https://pipedapi.tokhmi.xyz", name: "Tokhmi", region: "Global" },
  { url: "https://pipedapi.moomoo.me", name: "Moomoo", region: "Global" },
  { url: "https://api-piped.mha.fi", name: "MHA Finland", region: "EU" },
  { url: "https://pipedapi.adminforge.de", name: "AdminForge", region: "EU" },
  { url: "https://pipedapi.pfcd.me", name: "PFCD", region: "Global" },
]

export interface PipedSettings {
  preferredInstance: string
  autoFallback: boolean
}

export const pipedStorage = {
  getSettings(): PipedSettings {
    if (typeof window === "undefined") {
      return {
        preferredInstance: PIPED_INSTANCES[0].url,
        autoFallback: true,
      }
    }

    try {
      const stored = localStorage.getItem(PIPED_STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (error) {
      console.error("[v0] Error reading Piped settings:", error)
    }

    return {
      preferredInstance: PIPED_INSTANCES[0].url,
      autoFallback: true,
    }
  },

  saveSettings(settings: PipedSettings): void {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(PIPED_STORAGE_KEY, JSON.stringify(settings))
    } catch (error) {
      console.error("[v0] Error saving Piped settings:", error)
    }
  },

  setPreferredInstance(instanceUrl: string): void {
    const settings = this.getSettings()
    settings.preferredInstance = instanceUrl
    this.saveSettings(settings)
  },

  toggleAutoFallback(): boolean {
    const settings = this.getSettings()
    settings.autoFallback = !settings.autoFallback
    this.saveSettings(settings)
    return settings.autoFallback
  },
}

// Test instance connectivity
export async function testPipedInstance(instanceUrl: string): Promise<{
  success: boolean
  latency?: number
  error?: string
}> {
  const startTime = Date.now()

  try {
    const response = await fetch(`${instanceUrl}/trending?region=US`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    })

    const latency = Date.now() - startTime

    if (!response.ok) {
      return {
        success: false,
        latency,
        error: `HTTP ${response.status}`,
      }
    }

    return { success: true, latency }
  } catch (error) {
    return {
      success: false,
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Connection failed",
    }
  }
}
