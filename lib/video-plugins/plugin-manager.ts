import type { VideoPlugin, PluginManager as IPluginManager, SearchOptions, SearchResult } from "./plugin-interface"
import { githubExtensionLoader, type GitHubExtension } from "./github-extension-loader"

class PluginManager implements IPluginManager {
  plugins = new Map<string, VideoPlugin>()
  private githubExtensions: GitHubExtension[] = []

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
    return Array.from(this.plugins.values()).filter((plugin) => plugin.isEnabled())
  }

  async loadGitHubExtensions(): Promise<void> {
    try {
      console.log("[v0] Loading extensions from GitHub repositories...")
      this.githubExtensions = await githubExtensionLoader.getAllExtensions()
      console.log(`[v0] Loaded ${this.githubExtensions.length} GitHub extensions`)
    } catch (error) {
      console.error("[v0] Failed to load GitHub extensions:", error)
    }
  }

  getGitHubExtensions(): GitHubExtension[] {
    return this.githubExtensions
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

    // For now, use the first enabled plugin
    // In the future, we could merge results from multiple plugins
    const primaryPlugin = enabledPlugins[0]

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
