"use client"

/**
 * Sonos API integration for casting music to Sonos devices
 * Based on the official Sonos Control API
 * https://docs.sonos.com/docs/javascript-sample-app
 */

interface SonosAuthConfig {
  clientId: string
  redirectUri: string
}

interface SonosDevice {
  id: string
  name: string
  type: "sonos"
  connected: boolean
  available: boolean
  model?: string
  householdId?: string
}

interface SonosHousehold {
  id: string
  name: string
}

class SonosAPI {
  private accessToken: string | null = null
  private households: SonosHousehold[] = []
  private devices: SonosDevice[] = []
  private config: SonosAuthConfig | null = null
  private baseUrl = "https://api.ws.sonos.com/control/api/v1"

  configure(config: SonosAuthConfig) {
    this.config = config
  }

  isConfigured(): boolean {
    return this.config !== null
  }

  isAuthenticated(): boolean {
    return this.accessToken !== null
  }

  /**
   * Initiates OAuth authentication flow
   */
  authenticate() {
    if (!this.config) {
      throw new Error("Sonos API not configured. Set clientId and redirectUri first.")
    }

    const authUrl = new URL("https://api.sonos.com/login/v3/oauth")
    authUrl.searchParams.set("client_id", this.config.clientId)
    authUrl.searchParams.set("response_type", "code")
    authUrl.searchParams.set("redirect_uri", this.config.redirectUri)
    authUrl.searchParams.set("scope", "playback-control-all")
    authUrl.searchParams.set("state", this.generateState())

    // Open in popup window
    const width = 500
    const height = 700
    const left = window.screen.width / 2 - width / 2
    const top = window.screen.height / 2 - height / 2

    window.open(authUrl.toString(), "Sonos Authentication", `width=${width},height=${height},left=${left},top=${top}`)
  }

  /**
   * Handles OAuth callback with authorization code
   */
  async handleCallback(code: string): Promise<boolean> {
    if (!this.config) return false

    try {
      // Exchange code for access token
      // NOTE: This should be done on your backend to keep client_secret secure
      const response = await fetch("https://api.sonos.com/login/v3/oauth/access", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: this.config.redirectUri,
        }),
      })

      if (!response.ok) return false

      const data = await response.json()
      this.accessToken = data.access_token

      // Store token in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("sonos_access_token", data.access_token)
      }

      return true
    } catch (error) {
      console.error("Sonos OAuth callback error:", error)
      return false
    }
  }

  /**
   * Load stored access token
   */
  loadStoredToken(): boolean {
    if (typeof window === "undefined") return false

    const token = localStorage.getItem("sonos_access_token")
    if (token) {
      this.accessToken = token
      return true
    }
    return false
  }

  /**
   * Fetch households (Sonos systems)
   */
  async fetchHouseholds(): Promise<SonosHousehold[]> {
    if (!this.accessToken) {
      throw new Error("Not authenticated with Sonos")
    }

    try {
      const response = await fetch(`${this.baseUrl}/households`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      })

      if (!response.ok) throw new Error("Failed to fetch households")

      const data = await response.json()
      this.households = data.households || []
      return this.households
    } catch (error) {
      console.error("Error fetching Sonos households:", error)
      return []
    }
  }

  /**
   * Fetch groups (devices) in a household
   */
  async fetchGroups(householdId: string): Promise<SonosDevice[]> {
    if (!this.accessToken) {
      throw new Error("Not authenticated with Sonos")
    }

    try {
      const response = await fetch(`${this.baseUrl}/households/${householdId}/groups`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      })

      if (!response.ok) throw new Error("Failed to fetch groups")

      const data = await response.json()
      const groups = data.groups || []

      this.devices = groups.map((group: any) => ({
        id: group.id,
        name: group.name || "Sonos Speaker",
        type: "sonos" as const,
        connected: false,
        available: true,
        model: group.coordinatorId,
        householdId,
      }))

      return this.devices
    } catch (error) {
      console.error("Error fetching Sonos groups:", error)
      return []
    }
  }

  /**
   * Play music on a Sonos device
   */
  async playOnDevice(groupId: string, streamUrl: string, metadata?: any): Promise<boolean> {
    if (!this.accessToken) {
      throw new Error("Not authenticated with Sonos")
    }

    try {
      const response = await fetch(`${this.baseUrl}/groups/${groupId}/playback/play`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          streamUrl,
          metadata,
        }),
      })

      return response.ok
    } catch (error) {
      console.error("Error playing on Sonos device:", error)
      return false
    }
  }

  /**
   * Pause playback on a Sonos device
   */
  async pauseDevice(groupId: string): Promise<boolean> {
    if (!this.accessToken) {
      throw new Error("Not authenticated with Sonos")
    }

    try {
      const response = await fetch(`${this.baseUrl}/groups/${groupId}/playback/pause`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      })

      return response.ok
    } catch (error) {
      console.error("Error pausing Sonos device:", error)
      return false
    }
  }

  /**
   * Get current playback state
   */
  async getPlaybackState(groupId: string): Promise<any> {
    if (!this.accessToken) {
      throw new Error("Not authenticated with Sonos")
    }

    try {
      const response = await fetch(`${this.baseUrl}/groups/${groupId}/playback`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      })

      if (!response.ok) return null

      return await response.json()
    } catch (error) {
      console.error("Error getting playback state:", error)
      return null
    }
  }

  /**
   * Disconnect and clear tokens
   */
  disconnect() {
    this.accessToken = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("sonos_access_token")
    }
  }

  private generateState(): string {
    return Math.random().toString(36).substring(7)
  }

  getDevices(): SonosDevice[] {
    return this.devices
  }
}

export const sonosAPI = new SonosAPI()
export type { SonosDevice, SonosHousehold }
