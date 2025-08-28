import type { VideoPlugin, PluginManager as IPluginManager, SearchOptions, SearchResult } from "./plugin-interface"
import { githubExtensionLoader, type GitHubExtension } from "./github-extension-loader"

class PluginManager implements IPluginManager {
  plugins = new Map<string, VideoPlugin>()
  private githubExtensions: GitHubExtension[] = []
  private githubPlugins = new Map<string, VideoPlugin>()

  registerPlugin(plugin: VideoPlugin): void {
    console.log(`[v0] Registering video plugin: ${plugin.name} v${plugin.version}`)
    this.plugins.set(plugin.id, plugin)
  }

  unregisterPlugin(pluginId: string): void {
    console.log(`[v0] Unregistering video plugin: ${pluginId}`)
    this.plugins.delete(pluginId)
  }

  getPlugin(pluginId: string): VideoPlugin | undefined {
    return this.plugins.get(pluginId)
  }

  getEnabledPlugins(): VideoPlugin[] {
    const regularPlugins = Array.from(this.plugins.values()).filter((plugin) => plugin.isEnabled())
    const githubPlugins = Array.from(this.githubPlugins.values()).filter((plugin) => plugin.isEnabled())
    return [...regularPlugins, ...githubPlugins]
  }

  async loadGitHubExtensions(): Promise<void> {
    try {
      console.log("[v0] Loading extensions from GitHub repositories...")
      this.githubExtensions = await githubExtensionLoader.getAllExtensions()

      // Create actual plugin instances from extensions
      for (const extension of this.githubExtensions) {
        try {
          const plugin = await githubExtensionLoader.createPluginFromExtension(extension)
          if (plugin) {
            this.githubPlugins.set(extension.id, plugin)
            console.log(`[v0] Created plugin from extension: ${extension.name}`)
          }
        } catch (error) {
          console.error(`[v0] Failed to create plugin from extension ${extension.name}:`, error)
        }
      }

      console.log(
        `[v0] Loaded ${this.githubExtensions.length} GitHub extensions, created ${this.githubPlugins.size} plugins`,
      )
    } catch (error) {
      console.error("[v0] Failed to load GitHub extensions:", error)
    }
  }

  getGitHubPlugin(extensionId: string): VideoPlugin | undefined {
    return this.githubPlugins.get(extensionId)
  }

  async searchAll(options: SearchOptions): Promise<SearchResult> {
    const enabledPlugins = this.getEnabledPlugins()

    if (enabledPlugins.length === 0) {
      return {
        videos: [],
        totalCount: 0,
        currentPage: options.page || 1,
        hasNextPage: false,
        error: "No video plugins enabled",
      }
    }

    // Use the selected plugin if specified, otherwise use the first enabled plugin
    const selectedPluginId = localStorage.getItem("selectedVideoPlugin")
    let primaryPlugin = enabledPlugins[0]

    if (selectedPluginId) {
      const selectedPlugin = this.plugins.get(selectedPluginId) || this.githubPlugins.get(selectedPluginId)
      if (selectedPlugin && selectedPlugin.isEnabled()) {
        primaryPlugin = selectedPlugin
      }
    }

    try {
      console.log(`[v0] Searching videos using plugin: ${primaryPlugin.name}`)
      return await primaryPlugin.search(options)
    } catch (error) {
      console.error(`[v0] Plugin search error:`, error)
      return {
        videos: [],
        totalCount: 0,
        currentPage: options.page || 1,
        hasNextPage: false,
        error: `Search failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      }
    }
  }

  async initializeAll(): Promise<void> {
    const plugins = Array.from(this.plugins.values())
    console.log(`[v0] Initializing ${plugins.length} video plugins`)

    await this.loadGitHubExtensions()

    await Promise.all(
      plugins.map(async (plugin) => {
        try {
          await plugin.initialize()
          console.log(`[v0] Initialized plugin: ${plugin.name}`)
        } catch (error) {
          console.error(`[v0] Failed to initialize plugin ${plugin.name}:`, error)
        }
      }),
    )
  }
}

export const videoPluginManager = new PluginManager()
