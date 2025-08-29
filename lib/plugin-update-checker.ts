export interface PluginVersion {
  id: string
  name: string
  version: string
  lastChecked: Date
  repositoryUrl: string
}

export class PluginUpdateChecker {
  private static instance: PluginUpdateChecker
  private plugins: Map<string, PluginVersion> = new Map()
  private checkInterval: NodeJS.Timeout | null = null
  private addNotification: ((notification: any) => void) | null = null

  static getInstance(): PluginUpdateChecker {
    if (!PluginUpdateChecker.instance) {
      PluginUpdateChecker.instance = new PluginUpdateChecker()
    }
    return PluginUpdateChecker.instance
  }

  setNotificationHandler(addNotification: (notification: any) => void) {
    this.addNotification = addNotification
  }

  registerPlugin(plugin: PluginVersion) {
    console.log("[v0] Registering plugin for update checking:", plugin.name)
    this.plugins.set(plugin.id, plugin)
    this.savePlugins()
  }

  unregisterPlugin(pluginId: string) {
    this.plugins.delete(pluginId)
    this.savePlugins()
  }

  startChecking(intervalMinutes = 60) {
    console.log("[v0] Starting plugin update checker with interval:", intervalMinutes, "minutes")

    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }

    // Check immediately
    this.checkAllPlugins()

    // Then check at intervals
    this.checkInterval = setInterval(
      () => {
        this.checkAllPlugins()
      },
      intervalMinutes * 60 * 1000,
    )
  }

  stopChecking() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  private async checkAllPlugins() {
    console.log("[v0] Checking for plugin updates...")

    for (const [pluginId, plugin] of this.plugins) {
      try {
        await this.checkPluginUpdate(plugin)
      } catch (error) {
        console.error("[v0] Failed to check update for plugin:", plugin.name, error)
      }
    }
  }

  private async checkPluginUpdate(plugin: PluginVersion) {
    try {
      // Convert repository URL to API URL for version checking
      const apiUrl = this.convertToApiUrl(plugin.repositoryUrl)
      if (!apiUrl) return

      console.log("[v0] Checking plugin update:", plugin.name, "at", apiUrl)

      const response = await fetch(apiUrl)
      if (!response.ok) return

      const data = await response.json()

      // Extract version from manifest or repository
      const latestVersion = this.extractVersion(data)

      if (latestVersion && this.isNewerVersion(latestVersion, plugin.version)) {
        console.log("[v0] Plugin update available:", plugin.name, plugin.version, "->", latestVersion)

        if (this.addNotification) {
          this.addNotification({
            title: `Plugin Update Available`,
            message: `${plugin.name} has been updated to v${latestVersion}`,
            type: "plugin-update",
            pluginId: plugin.id,
            version: latestVersion,
            actionUrl: plugin.repositoryUrl,
          })
        }

        // Update stored version
        plugin.version = latestVersion
        plugin.lastChecked = new Date()
        this.plugins.set(plugin.id, plugin)
        this.savePlugins()
      } else {
        // Update last checked time
        plugin.lastChecked = new Date()
        this.plugins.set(plugin.id, plugin)
        this.savePlugins()
      }
    } catch (error) {
      console.error("[v0] Error checking plugin update:", plugin.name, error)
    }
  }

  private convertToApiUrl(repositoryUrl: string): string | null {
    try {
      // Handle different GitHub URL formats
      if (repositoryUrl.includes("raw.githubusercontent.com")) {
        // Extract owner/repo from raw URL
        const match = repositoryUrl.match(/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)/)
        if (match) {
          return `https://api.github.com/repos/${match[1]}/${match[2]}/commits/HEAD`
        }
      } else if (repositoryUrl.includes("github.com")) {
        // Handle regular GitHub URLs
        const match = repositoryUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
        if (match) {
          return `https://api.github.com/repos/${match[1]}/${match[2]}/commits/HEAD`
        }
      }
      return null
    } catch (error) {
      console.error("[v0] Failed to convert repository URL:", error)
      return null
    }
  }

  private extractVersion(data: any): string | null {
    try {
      // Try to extract version from commit SHA (first 7 characters)
      if (data.sha) {
        return data.sha.substring(0, 7)
      }

      // Try to extract from commit message
      if (data.commit?.message) {
        const versionMatch = data.commit.message.match(/v?(\d+\.\d+\.\d+)/i)
        if (versionMatch) {
          return versionMatch[1]
        }
      }

      return null
    } catch (error) {
      console.error("[v0] Failed to extract version:", error)
      return null
    }
  }

  private isNewerVersion(newVersion: string, currentVersion: string): boolean {
    // Simple version comparison - in a real app you'd use semver
    return newVersion !== currentVersion
  }

  private savePlugins() {
    try {
      const pluginsArray = Array.from(this.plugins.values())
      localStorage.setItem("plugin-versions", JSON.stringify(pluginsArray))
    } catch (error) {
      console.error("[v0] Failed to save plugin versions:", error)
    }
  }

  loadPlugins() {
    try {
      const stored = localStorage.getItem("plugin-versions")
      if (stored) {
        const pluginsArray = JSON.parse(stored)
        this.plugins.clear()
        pluginsArray.forEach((plugin: PluginVersion) => {
          plugin.lastChecked = new Date(plugin.lastChecked)
          this.plugins.set(plugin.id, plugin)
        })
      }
    } catch (error) {
      console.error("[v0] Failed to load plugin versions:", error)
    }
  }
}
