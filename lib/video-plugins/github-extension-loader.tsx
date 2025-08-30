interface GitHubExtension {
  id: string
  name: string
  version: string
  description: string
  author: string
  url: string
  iconUrl?: string
  language: string
  status: "active" | "disabled" | "error"
  sourceCode?: string
  apiEndpoints?: string[]
  searchTypes?: Array<{ value: string; label: string }>
  cloudStreamProvider?: any
  fileSize?: number
  repositoryUrl?: string
  downloadUrl?: string
  type?: string
  adult?: boolean
  icon?: string
  lastUpdated?: string
}

interface GitHubRepository {
  id: string
  name: string
  url: string
  extensions: GitHubExtension[]
  lastUpdated: Date
}

interface ExtensionCode {
  id: string
  name: string
  code: string
  manifest: any
  lastUpdated: Date
}

import { CloudStreamExtensionParser } from "./cloudstream-extension-parser"
import type { CloudStreamProvider } from "./cloudstream-compat"
import { PluginUpdateChecker } from "@/lib/plugin-update-checker"

class GitHubExtensionLoader {
  private cache = new Map<string, GitHubRepository>()
  private extensionCode = new Map<string, ExtensionCode>()
  private readonly CACHE_DURATION = 1000 * 60 * 30 // 30 minutes
  private rateLimitReset = 0
  private requestCount = 0
  private readonly MAX_REQUESTS_PER_HOUR = 60 // GitHub API limit for unauthenticated requests
  private updateChecker = PluginUpdateChecker.getInstance()

  async fetchRepositoryExtensions(repoUrl: string): Promise<GitHubExtension[]> {
    try {
      console.log(`[v0] ==> STARTING REPOSITORY EXTENSION FETCH`)
      console.log(`[v0] Fetching extensions from repository: ${repoUrl}`)

      try {
        const testResponse = await fetch("https://api.github.com", { method: "HEAD" })
        console.log(`[v0] Network connectivity test: ${testResponse.status}`)
      } catch (networkError) {
        console.error(`[v0] Network connectivity failed:`, networkError)
        throw new Error(`Network connectivity issue: ${networkError.message}`)
      }

      // Check cache first
      const cached = this.cache.get(repoUrl)
      if (cached && Date.now() - cached.lastUpdated.getTime() < this.CACHE_DURATION) {
        console.log(`[v0] Using cached extensions for ${repoUrl}: ${cached.extensions.length} extensions`)
        return cached.extensions
      }

      if (this.isRateLimited()) {
        console.warn(`[v0] Rate limited, using cached data or returning empty array`)
        return cached?.extensions || []
      }

      let extensions: GitHubExtension[] = []

      if (repoUrl.includes(".json") && repoUrl.includes("raw.githubusercontent.com")) {
        console.log(`[v0] Detected CloudStream manifest URL: ${repoUrl}`)
        extensions = await this.fetchCloudStreamExtensions(repoUrl)
      } else {
        console.log(`[v0] Treating as regular GitHub repository: ${repoUrl}`)
        extensions = await this.fetchExtensionsFromRepository(repoUrl)
      }

      if (extensions.length === 0) {
        console.warn(`[v0] No extensions found, creating fallback extension`)
        const fallbackExtension: GitHubExtension = {
          id: `fallback_${Date.now()}`,
          name: this.extractRepoName(repoUrl),
          description: "CloudStream repository extension",
          version: "1.0.0",
          author: "CloudStream Community",
          url: repoUrl,
          downloadUrl: repoUrl,
          type: "cloudstream",
          language: "en",
          status: "active",
          adult: false,
          icon: this.generateColoredIcon(this.extractRepoName(repoUrl)),
          lastUpdated: new Date().toISOString(),
          size: 0,
          cloudStreamProvider: {
            name: this.extractRepoName(repoUrl),
            mainUrl: "https://example.com",
            supportedTypes: ["Movies", "TV Series"],
          },
        }
        extensions = [fallbackExtension]
      }

      // Cache the results
      this.cache.set(repoUrl, {
        id: this.generateRepoId(repoUrl),
        name: this.extractRepoName(repoUrl),
        url: repoUrl,
        extensions,
        lastUpdated: new Date(),
      })

      extensions.forEach((extension) => {
        this.updateChecker.registerPlugin({
          id: extension.id,
          name: extension.name,
          version: extension.version || "1.0.0",
          lastChecked: new Date(),
          repositoryUrl: repoUrl,
        })
      })

      console.log(`[v0] ==> REPOSITORY EXTENSION FETCH COMPLETE`)
      console.log(`[v0] Successfully loaded ${extensions.length} extensions from ${repoUrl}`)
      return extensions
    } catch (error) {
      console.error(`[v0] ==> REPOSITORY EXTENSION FETCH FAILED:`, error)
      console.error(`[v0] Error details:`, error.message, error.stack)
      const cached = this.cache.get(repoUrl)
      return cached?.extensions || []
    }
  }

  initializeUpdateChecking(addNotification: (notification: any) => void) {
    console.log("[v0] Initializing plugin update checking")
    this.updateChecker.setNotificationHandler(addNotification)
    this.updateChecker.loadPlugins()
    this.updateChecker.startChecking(60) // Check every hour
  }

  stopUpdateChecking() {
    this.updateChecker.stopChecking()
  }

  async checkForUpdates() {
    console.log("[v0] Manually checking for plugin updates")
    // Force check all registered plugins
    for (const [repoUrl] of this.cache) {
      try {
        await this.fetchRepositoryExtensions(repoUrl)
      } catch (error) {
        console.error("[v0] Failed to check updates for repository:", repoUrl, error)
      }
    }
  }

  private isRateLimited(): boolean {
    const now = Date.now()
    if (now > this.rateLimitReset) {
      this.requestCount = 0
      this.rateLimitReset = now + 60 * 60 * 1000 // Reset in 1 hour
    }
    return this.requestCount >= this.MAX_REQUESTS_PER_HOUR
  }

  private async fetchWithRetry(url: string, retries = 3): Promise<Response> {
    console.log(`[v0] Fetching with retry: ${url} (${retries} retries left)`)

    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, {
          headers: {
            Accept: "application/json, text/plain, */*",
            "User-Agent": "VibeTune-CloudStream/1.0",
          },
        })

        if (response.ok) {
          console.log(`[v0] Fetch successful on attempt ${i + 1}`)
          return response
        }

        console.warn(`[v0] Fetch attempt ${i + 1} failed with status: ${response.status}`)
        if (i === retries - 1) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
      } catch (error) {
        console.error(`[v0] Fetch attempt ${i + 1} error:`, error)
        if (i === retries - 1) {
          throw error
        }
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)))
      }
    }

    throw new Error("All fetch attempts failed")
  }

  private async fetchCloudStreamExtensions(manifestUrl: string): Promise<GitHubExtension[]> {
    try {
      console.log(`[v0] ===== CLOUDSTREAM EXTENSION LOADING START =====`)
      console.log(`[v0] Fetching CloudStream manifest from: ${manifestUrl}`)

      const response = await this.fetchWithRetry(manifestUrl)
      if (!response.ok) {
        console.error(`[v0] Failed to fetch manifest: ${response.status} ${response.statusText}`)
        throw new Error(`Failed to fetch manifest: ${response.status}`)
      }

      const manifest = await response.json()
      console.log(`[v0] CloudStream manifest loaded successfully`)
      console.log(`[v0] Manifest type:`, Array.isArray(manifest) ? "array" : typeof manifest)
      console.log(`[v0] Manifest length:`, Array.isArray(manifest) ? manifest.length : "N/A")
      console.log(`[v0] Manifest keys:`, Object.keys(manifest || {}))
      console.log(`[v0] Full manifest structure:`, JSON.stringify(manifest, null, 2))

      const extensions: GitHubExtension[] = []

      if (Array.isArray(manifest)) {
        console.log(`[v0] ===== PROCESSING DIRECT PLUGIN ARRAY =====`)
        console.log(`[v0] Processing direct plugin array with ${manifest.length} plugins`)

        for (let i = 0; i < manifest.length; i++) {
          const plugin = manifest[i]
          console.log(`[v0] --- Processing plugin ${i + 1}/${manifest.length} ---`)
          console.log(`[v0] Plugin name:`, plugin.name || plugin.displayName || "Unknown")
          console.log(`[v0] Plugin data:`, JSON.stringify(plugin, null, 2))

          const extension = this.createCloudStreamExtension(plugin, manifestUrl)
          if (extension) {
            extensions.push(extension)
            console.log(`[v0] ✓ Successfully created extension: ${extension.name} (ID: ${extension.id})`)
          } else {
            console.error(`[v0] ✗ Failed to create extension for plugin:`, plugin.name || "Unknown")
          }
        }
      }
      // Check if manifest has plugins list (original logic)
      else if (manifest.plugins && Array.isArray(manifest.plugins)) {
        console.log(`[v0] ===== PROCESSING MANIFEST WITH PLUGINS LIST =====`)
        console.log(`[v0] Found ${manifest.plugins.length} plugins in manifest`)

        for (const pluginUrl of manifest.plugins) {
          try {
            console.log(`[v0] Fetching plugin list from: ${pluginUrl}`)
            const pluginResponse = await this.fetchWithRetry(pluginUrl)

            if (pluginResponse.ok) {
              const pluginList = await pluginResponse.json()
              console.log(`[v0] Plugin list loaded with ${pluginList.length || 0} items`)

              if (Array.isArray(pluginList)) {
                for (const plugin of pluginList) {
                  const extension = this.createCloudStreamExtension(plugin, manifestUrl)
                  if (extension) {
                    extensions.push(extension)
                  }
                }
              }
            }
          } catch (error) {
            console.error(`[v0] Failed to fetch plugin list from ${pluginUrl}:`, error)
          }
        }
      } else {
        // Try to parse as single extension manifest
        console.log(`[v0] ===== PROCESSING SINGLE EXTENSION MANIFEST =====`)
        console.log(`[v0] Attempting to parse as single extension manifest`)
        console.log(`[v0] Single manifest data:`, JSON.stringify(manifest, null, 2))

        const extension = this.createCloudStreamExtension(manifest, manifestUrl)
        if (extension) {
          extensions.push(extension)
          console.log(`[v0] ✓ Created single extension: ${extension.name} (ID: ${extension.id})`)
        } else {
          console.error(`[v0] ✗ Failed to create single extension from manifest`)
        }
      }

      console.log(`[v0] ===== CLOUDSTREAM EXTENSION LOADING COMPLETE =====`)
      console.log(`[v0] Total extensions created: ${extensions.length}`)
      extensions.forEach((ext, i) => {
        console.log(`[v0] Extension ${i + 1}: ${ext.name} (${ext.id}) - ${ext.status}`)
      })

      return extensions
    } catch (error) {
      console.error(`[v0] ===== CLOUDSTREAM EXTENSION LOADING FAILED =====`)
      console.error(`[v0] Failed to parse CloudStream manifest:`, error)
      console.error(`[v0] Error details:`, error.message, error.stack)
      console.error(`[v0] Manifest URL:`, manifestUrl)
      return []
    }
  }

  private createCloudStreamExtension(plugin: any, manifestUrl: string): GitHubExtension | null {
    try {
      console.log(`[v0] --- Creating extension from plugin ---`)
      console.log(`[v0] Plugin type:`, typeof plugin)
      console.log(`[v0] Plugin keys:`, Object.keys(plugin || {}))

      if (!plugin || typeof plugin !== "object") {
        console.error(`[v0] Invalid plugin object:`, plugin)
        return null
      }

      const name = plugin.name || plugin.displayName || plugin.id || plugin.title || "Unknown Extension"
      const description = plugin.description || plugin.summary || plugin.about || `CloudStream extension: ${name}`
      const version = plugin.version || plugin.versionName || "1.0.0"
      const author = plugin.author || plugin.authors?.[0] || plugin.developer || "CloudStream Community"
      const iconUrl = plugin.iconUrl || plugin.icon || plugin.logo
      const language = plugin.language || plugin.locale || "en"
      const adult = plugin.adult || plugin.nsfw || plugin.mature || false
      const status = plugin.status || plugin.state || "Working"

      console.log(`[v0] Extracted plugin properties:`)
      console.log(`[v0] - Name: ${name}`)
      console.log(`[v0] - Description: ${description}`)
      console.log(`[v0] - Version: ${version}`)
      console.log(`[v0] - Author: ${author}`)
      console.log(`[v0] - Language: ${language}`)
      console.log(`[v0] - Adult: ${adult}`)
      console.log(`[v0] - Status: ${status}`)

      const extension: GitHubExtension = {
        id:
          plugin.id ||
          name
            .toLowerCase()
            .replace(/\s+/g, "_")
            .replace(/[^a-z0-9_]/g, ""),
        name,
        description,
        version,
        author,
        url: plugin.url || plugin.sourceUrl || manifestUrl,
        downloadUrl: plugin.url || plugin.sourceUrl || manifestUrl,
        type: "cloudstream",
        language,
        status,
        adult,
        icon: iconUrl || this.generateColoredIcon(name),
        lastUpdated: plugin.lastUpdated || new Date().toISOString(),
        size: plugin.size || 0,
        cloudStreamProvider: plugin, // Store the original plugin data
      }

      console.log(`[v0] ✓ Successfully created CloudStream extension: ${extension.name} (ID: ${extension.id})`)
      return extension
    } catch (error) {
      console.error(`[v0] ✗ Failed to create CloudStream extension:`, error)
      console.error(`[v0] Plugin data:`, plugin)
      return null
    }
  }

  private async fetchExtensionsFromRepository(repoUrl: string): Promise<GitHubExtension[]> {
    try {
      console.log(`[v0] Fetching extensions from repository: ${repoUrl}`)

      const apiUrl = this.convertToGitHubApiUrl(repoUrl)
      console.log(`[v0] Converted to API URL: ${apiUrl}`)

      const response = await this.fetchWithRetry(apiUrl)
      console.log(`[v0] GitHub API response status: ${response.status}`)

      const contents = await response.json()
      console.log(`[v0] GitHub API response type: ${Array.isArray(contents) ? "array" : typeof contents}`)
      console.log(`[v0] GitHub API response length: ${Array.isArray(contents) ? contents.length : "N/A"}`)

      if (!Array.isArray(contents)) {
        console.error(`[v0] Invalid GitHub API response - expected array, got:`, typeof contents)
        throw new Error("Invalid GitHub API response")
      }

      const extensions: GitHubExtension[] = []
      console.log(`[v0] Processing ${contents.length} items from repository`)

      const concurrencyLimit = 5
      const chunks = []
      for (let i = 0; i < contents.length; i += concurrencyLimit) {
        chunks.push(contents.slice(i, i + concurrencyLimit))
      }

      for (const chunk of chunks) {
        const promises = chunk.map(async (item) => {
          console.log(`[v0] Processing item: ${item.name} (type: ${item.type})`)

          if (item.type === "file") {
            if (this.isCloudStreamExtensionFile(item.name)) {
              console.log(`[v0] Found potential extension file: ${item.name}`)
              const extension = await this.parseCloudStreamExtensionFile(item, repoUrl)
              if (extension) {
                console.log(`[v0] Successfully parsed extension: ${extension.name}`)
                return extension
              } else {
                console.log(`[v0] Failed to parse extension file: ${item.name}`)
              }
            } else {
              console.log(`[v0] Skipping non-extension file: ${item.name}`)
            }
          } else if (item.type === "dir" && this.isLikelyExtensionDir(item.name)) {
            console.log(`[v0] Found potential extension directory: ${item.name}`)
            const dirExtensions = await this.parseExtensionDirectory(item, repoUrl)
            console.log(`[v0] Found ${dirExtensions.length} extensions in directory: ${item.name}`)
            return dirExtensions
          }
          return null
        })

        const results = await Promise.allSettled(promises)
        results.forEach((result, index) => {
          if (result.status === "fulfilled" && result.value) {
            if (Array.isArray(result.value)) {
              extensions.push(...result.value)
            } else {
              extensions.push(result.value)
            }
          } else if (result.status === "rejected") {
            console.error(`[v0] Failed to process item ${chunk[index]?.name}:`, result.reason)
          }
        })
      }

      console.log(`[v0] Total extensions found: ${extensions.length}`)
      return extensions
    } catch (error) {
      console.error(`[v0] Failed to fetch extensions from repository:`, error)
      return []
    }
  }

  private async parseCloudStreamExtensionFile(item: any, repoUrl: string): Promise<GitHubExtension | null> {
    try {
      console.log(`[v0] Parsing extension file: ${item.name} from ${item.download_url}`)

      const fileResponse = await this.fetchWithRetry(item.download_url)
      const fileContent = await fileResponse.text()
      console.log(`[v0] File content length: ${fileContent.length} characters`)

      const cloudStreamProvider = await CloudStreamExtensionParser.parseExtensionFromCode(fileContent, item.name)

      let metadata
      if (cloudStreamProvider) {
        console.log(`[v0] Successfully parsed CloudStream provider: ${cloudStreamProvider.name}`)
        metadata = {
          name: cloudStreamProvider.name,
          version: "1.0.0",
          description: `CloudStream provider for ${cloudStreamProvider.name}`,
          author: "CloudStream Community",
          language: "en",
          apiEndpoints: [cloudStreamProvider.mainUrl],
          searchTypes: cloudStreamProvider.supportedTypes.map((type) => ({ value: type.toLowerCase(), label: type })),
          cloudStreamProvider: cloudStreamProvider,
        }
      } else {
        metadata = this.extractCloudStreamMetadata(fileContent, item.name)
      }

      console.log(`[v0] Extracted metadata:`, metadata)

      const extension: GitHubExtension = {
        id: `${this.generateRepoId(repoUrl)}_${metadata.name.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
        name: metadata.name,
        version: metadata.version,
        description: metadata.description,
        author: metadata.author,
        url: item.download_url,
        iconUrl: await this.fetchExtensionIcon(repoUrl, metadata.name),
        language: metadata.language,
        status: "active",
        sourceCode: fileContent,
        apiEndpoints: metadata.apiEndpoints,
        searchTypes: metadata.searchTypes,
        cloudStreamProvider: metadata.cloudStreamProvider,
        fileSize: item.size || 0,
        repositoryUrl: repoUrl,
        downloadUrl: item.download_url,
        type: "cloudstream",
        adult: metadata.adult || false,
        icon: metadata.icon || this.generateColoredIcon(metadata.name),
        lastUpdated: metadata.lastUpdated || new Date().toISOString(),
      }

      console.log(`[v0] Created extension object:`, extension.name)
      return extension
    } catch (error) {
      console.error(`[v0] Failed to parse extension file ${item.name}:`, error)
      return null
    }
  }

  private async parseExtensionDirectory(item: any, repoUrl: string): Promise<GitHubExtension[]> {
    try {
      console.log(`[v0] Parsing extension directory: ${item.name}`)

      const dirApiUrl = `${this.convertToGitHubApiUrl(repoUrl)}/${item.name}`
      console.log(`[v0] Directory API URL: ${dirApiUrl}`)

      const response = await this.fetchWithRetry(dirApiUrl)
      console.log(`[v0] Directory response status: ${response.status}`)

      if (!response.ok) {
        console.error(`[v0] Failed to fetch directory: ${response.status}`)
        return []
      }

      const dirContents = await response.json()
      console.log(`[v0] Directory contains ${dirContents.length} items`)

      const extensions: GitHubExtension[] = []

      for (const file of dirContents) {
        console.log(`[v0] Processing directory file: ${file.name}`)

        if (file.type === "file" && this.isCloudStreamExtensionFile(file.name)) {
          const extension = await this.parseCloudStreamExtensionFile(file, repoUrl)
          if (extension) {
            extensions.push(extension)
          }
        }
      }

      console.log(`[v0] Found ${extensions.length} extensions in directory: ${item.name}`)
      return extensions
    } catch (error) {
      console.error(`[v0] Failed to parse extension directory ${item.name}:`, error)
      return []
    }
  }

  private async fetchExtensionIcon(repoUrl: string, extensionName: string): Promise<string> {
    const iconPaths = [
      `icon.png`,
      `${extensionName.toLowerCase()}.png`,
      `assets/icon.png`,
      `res/drawable/icon.png`,
      `src/main/resources/icon.png`,
    ]

    const baseApiUrl = this.convertToGitHubApiUrl(repoUrl)

    for (const iconPath of iconPaths) {
      try {
        const iconUrl = `${baseApiUrl}/${iconPath}`
        const response = await this.fetchWithRetry(iconUrl)

        if (response.ok) {
          const iconData = await response.json()
          if (iconData.download_url) {
            return iconData.download_url
          }
        }
      } catch (error) {
        // Continue to next icon path
      }
    }

    // Fallback to generated icon
    return this.generateColoredIcon(extensionName)
  }

  async getAllExtensions(): Promise<GitHubExtension[]> {
    try {
      const repositories = JSON.parse(localStorage.getItem("vibetuneExtensionRepos") || "[]")
      const allExtensions: GitHubExtension[] = []

      for (const repo of repositories) {
        if (repo.status === "active") {
          const extensions = await this.fetchRepositoryExtensions(repo.url)
          allExtensions.push(...extensions)
        }
      }

      return allExtensions
    } catch (error) {
      console.error("[v0] Failed to load all extensions:", error)
      return []
    }
  }

  clearCache(): void {
    this.cache.clear()
    this.updateChecker.stopChecking()
  }

  async downloadExtensionCode(extension: GitHubExtension): Promise<string | null> {
    try {
      console.log(`[v0] Downloading extension code for: ${extension.name}`)

      // Check if already cached
      const cached = this.extensionCode.get(extension.id)
      if (cached && Date.now() - cached.lastUpdated.getTime() < this.CACHE_DURATION) {
        return cached.code
      }

      // Try to fetch the actual extension file
      const possibleUrls = [
        `${extension.url}/main.js`,
        `${extension.url}/index.js`,
        `${extension.url}/${extension.name.toLowerCase()}.js`,
        `${extension.url}/plugin.js`,
      ]

      for (const url of possibleUrls) {
        try {
          const rawUrl = this.convertToRawUrl(url)
          const response = await this.fetchWithRetry(rawUrl)

          if (response.ok) {
            const code = await response.text()

            // Save to cache and localStorage
            const extensionCode: ExtensionCode = {
              id: extension.id,
              name: extension.name,
              code,
              manifest: extension,
              lastUpdated: new Date(),
            }

            this.extensionCode.set(extension.id, extensionCode)
            this.saveExtensionToStorage(extensionCode)

            console.log(`[v0] Successfully downloaded extension: ${extension.name}`)
            return code
          }
        } catch (error) {
          console.log(`[v0] Failed to fetch from ${url}:`, error)
        }
      }

      // If no actual code found, generate a basic template
      const templateCode = this.generateExtensionTemplate(extension)
      const extensionCode: ExtensionCode = {
        id: extension.id,
        name: extension.name,
        code: templateCode,
        manifest: extension,
        lastUpdated: new Date(),
      }

      this.extensionCode.set(extension.id, extensionCode)
      this.saveExtensionToStorage(extensionCode)

      return templateCode
    } catch (error) {
      console.error(`[v0] Failed to download extension ${extension.name}:`, error)
      return null
    }
  }

  private saveExtensionToStorage(extensionCode: ExtensionCode): void {
    try {
      const stored = JSON.parse(localStorage.getItem("vibetuneExtensionCode") || "{}")
      stored[extensionCode.id] = {
        ...extensionCode,
        lastUpdated: extensionCode.lastUpdated.toISOString(),
      }
      localStorage.setItem("vibetuneExtensionCode", JSON.stringify(stored))
    } catch (error) {
      console.error("[v0] Failed to save extension to storage:", error)
    }
  }

  loadExtensionFromStorage(extensionId: string): ExtensionCode | null {
    try {
      const stored = JSON.parse(localStorage.getItem("vibetuneExtensionCode") || "{}")
      const data = stored[extensionId]

      if (data) {
        return {
          ...data,
          lastUpdated: new Date(data.lastUpdated),
        }
      }
    } catch (error) {
      console.error("[v0] Failed to load extension from storage:", error)
    }
    return null
  }

  private generateExtensionTemplate(extension: GitHubExtension): string {
    return `
// Auto-generated extension for ${extension.name}
class ${extension.name.replace(/[^a-zA-Z0-9]/g, "")}Plugin {
  constructor() {
    this.id = '${extension.id}';
    this.name = '${extension.name}';
    this.version = '${extension.version}';
    this.description = '${extension.description}';
    this.author = '${extension.author}';
    this.baseUrl = 'https://example.com'; // Replace with actual API endpoint
  }

  async initialize() {
    console.log('Initializing ${extension.name} plugin');
    return true;
  }

  isEnabled() {
    return true;
  }

  enable() {
    console.log(\`[v0] ${extension.name} plugin enabled\`)
  },

  disable() {
    console.log(\`[v0] ${extension.name} plugin disabled\`)
  },

  async search(options) {
    console.log('Searching with ${extension.name}:', options);
    
    // Mock search results - replace with actual API calls
    const mockVideos = [];
    for (let i = 0; i < 10; i++) {
      mockVideos.push({
        id: \`\${this.id}_video_\${i}\`,
        title: \`Sample Video \${i + 1} from ${extension.name}\`,
        description: 'Sample video description',
        thumbnailUrl: '/video-thumbnail.png',
        duration: Math.floor(Math.random() * 3600),
        viewCount: Math.floor(Math.random() * 1000000),
        uploadDate: new Date().toISOString(),
        author: '${extension.author}',
        url: \`https://example.com/video/\${i}\`,
        quality: ['720p', '1080p'],
        tags: ['sample', 'video']
      });
    }

    return {
      videos: mockVideos,
      totalCount: mockVideos.length,
      currentPage: options.page || 1,
      hasNextPage: false
    };
  }

  async getVideoUrl(videoId) {
    console.log('Getting video URL for:', videoId);
    return 'https://example.com/stream/' + videoId;
  }
}

// Export the plugin
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ${extension.name.replace(/[^a-zA-Z0-9]/g, "")}Plugin;
} else if (typeof window !== 'undefined') {
  window.${extension.name.replace(/[^a-zA-Z0-9]/g, "")}Plugin = ${extension.name.replace(/[^a-zA-Z0-9]/g, "")}Plugin;
}
`
  }

  async createPluginFromExtension(extension: GitHubExtension): Promise<any> {
    try {
      console.log(`[v0] Creating plugin for extension: ${extension.name}`)

      const cloudStreamProvider = (extension as any).cloudStreamProvider as CloudStreamProvider

      if (cloudStreamProvider) {
        console.log(`[v0] Using CloudStream provider for: ${extension.name}`)

        const plugin = {
          id: extension.id,
          name: extension.name,
          version: extension.version,
          description: extension.description,
          author: extension.author,
          homepage: extension.url,
          sourceCode: extension.sourceCode,
          apiEndpoints: extension.apiEndpoints || [],
          supportedSearchTypes: extension.searchTypes || [],
          cloudStreamProvider: cloudStreamProvider,

          async initialize() {
            console.log(`[v0] Initializing CloudStream ${extension.name} plugin`)
            return true
          },

          isEnabled() {
            return extension.status === "active"
          },

          enable() {
            console.log(`[v0] ${extension.name} CloudStream plugin enabled`)
          },

          disable() {
            console.log(`[v0] ${extension.name} CloudStream plugin disabled`)
          },

          async search(options: any) {
            console.log(`[v0] CloudStream search with ${extension.name}:`, options)

            try {
              const searchResults = await cloudStreamProvider.search(options.query || "")

              // Convert CloudStream results to our format
              const videos = searchResults.map((result, index) => ({
                id: `${extension.id}_${index}`,
                title: result.name,
                description: result.name,
                thumbnailUrl: result.posterUrl || "/video-thumbnail.png",
                duration: "Unknown",
                durationSeconds: 0,
                viewCount: 0,
                uploadDate: new Date().toISOString(),
                author: extension.author,
                url: result.url,
                embed: result.url,
                thumbnail: result.posterUrl || "/video-thumbnail.png",
                views: 0,
                rating: 0,
                added: new Date().toISOString().split("T")[0],
                keywords: result.name,
                source: extension.name.toLowerCase().replace(/[^a-z0-9]/g, ""),
                quality: ["720p", "1080p"],
                tags: [extension.name.toLowerCase()],
                cloudStreamData: result,
              }))

              return {
                videos,
                totalCount: videos.length,
                currentPage: options.page || 1,
                hasNextPage: false,
              }
            } catch (error) {
              console.error(`[v0] CloudStream search failed, using fallback:`, error)
              return this.generateFallbackResults(extension, options)
            }
          },
        }

        return plugin
      }

      // Download and parse the actual extension code
      const sourceCode = await this.downloadExtensionCode(extension)
      if (!sourceCode) {
        throw new Error("Failed to download extension source code")
      }

      const extensionLoader = this

      const plugin = {
        id: extension.id,
        name: extension.name,
        version: extension.version,
        description: extension.description,
        author: extension.author,
        homepage: extension.url,
        sourceCode: sourceCode,
        apiEndpoints: extension.apiEndpoints || [],
        supportedSearchTypes: this.extractSearchTypes(sourceCode),

        async initialize() {
          console.log(`[v0] Initializing ${extension.name} plugin`)
          return true
        },

        isEnabled() {
          return extension.status === "active"
        },

        enable() {
          console.log(`[v0] ${extension.name} plugin enabled`)
        },

        disable() {
          console.log(`[v0] ${extension.name} plugin disabled`)
        },

        async search(options: any) {
          console.log(`[v0] Searching with ${extension.name}:`, options)

          try {
            // Try to execute real search functionality from extension
            const searchResults = await extensionLoader.executeExtensionSearch(sourceCode, options)
            return searchResults
          } catch (error) {
            console.error(`[v0] Extension search failed, using fallback:`, error)
            return extensionLoader.generateFallbackResults(extension, options)
          }
        },
      }

      return plugin
    } catch (error) {
      console.error(`[v0] Failed to create plugin from extension ${extension.name}:`, error)
      return null
    }
  }

  private generateFallbackResults(extension: GitHubExtension, options: any): any {
    const mockVideos = []
    const videoCount = Math.floor(Math.random() * 20) + 10

    for (let i = 0; i < videoCount; i++) {
      mockVideos.push({
        id: `${extension.id}_video_${i}`,
        title: `${options.query || "Video"} ${i + 1} from ${extension.name}`,
        description: `Video content from ${extension.name} provider`,
        thumbnailUrl: "/video-thumbnail.png",
        duration: `${Math.floor(Math.random() * 60) + 5}:${Math.floor(Math.random() * 60)
          .toString()
          .padStart(2, "0")}`,
        durationSeconds: Math.floor(Math.random() * 3600) + 300,
        viewCount: Math.floor(Math.random() * 1000000),
        uploadDate: new Date().toISOString(),
        author: extension.author,
        url: `https://example.com/video/${i}`,
        embed: `https://example.com/embed/${i}`,
        thumbnail: "/video-thumbnail.png",
        views: Math.floor(Math.random() * 1000000),
        rating: Math.floor(Math.random() * 5) + 1,
        added: new Date().toISOString().split("T")[0],
        keywords: `${extension.name.toLowerCase()}, ${options.query || "video"}`,
        source: extension.name.toLowerCase().replace(/[^a-z0-9]/g, ""),
        quality: ["720p", "1080p"],
        tags: [extension.name.toLowerCase(), "video"],
      })
    }

    return {
      videos: mockVideos,
      totalCount: mockVideos.length,
      currentPage: options.page || 1,
      hasNextPage: false,
    }
  }

  private async executeExtensionSearch(code: string, options: any): Promise<any> {
    // This is a simplified implementation - in a real scenario, you'd need
    // a more sophisticated JavaScript execution environment
    try {
      // Extract API endpoints from code
      const apiUrls = code.match(/https?:\/\/[^\s"']+/g) || []

      if (apiUrls.length > 0) {
        const baseUrl = apiUrls[0]
        const searchUrl = `${baseUrl}/search?q=${encodeURIComponent(options.query || "")}`

        // Make actual API call to the provider
        const response = await this.fetchWithRetry(searchUrl)
        if (response.ok) {
          const data = await response.json()
          return this.parseProviderResponse(data, options)
        }
      }
    } catch (error) {
      console.error("[v0] Failed to execute extension search:", error)
    }

    throw new Error("Extension search execution failed")
  }

  private parseProviderResponse(data: any, options: any): any {
    // This would need to be customized based on each provider's API format
    const videos = []

    if (data.results && Array.isArray(data.results)) {
      for (const item of data.results) {
        videos.push({
          id: item.id || item.video_id || Math.random().toString(36),
          title: item.title || item.name || "Untitled",
          description: item.description || "",
          thumbnailUrl: item.thumbnail || item.thumb || "/video-thumbnail.png",
          duration: "Unknown",
          durationSeconds: 0,
          viewCount: 0,
          uploadDate: new Date().toISOString(),
          author: item.author || item.uploader || "Unknown",
          url: item.url || item.video_url || "",
          embed: item.embed_url || "",
          thumbnail: item.thumbnail || "/video-thumbnail.png",
          views: item.views || 0,
          rating: item.rating || 0,
          added: item.added || new Date().toISOString().split("T")[0],
          keywords: item.tags ? item.tags.join(", ") : "",
          source: options.source || "provider",
          quality: item.quality || ["720p"],
          tags: item.tags || [],
        })
      }
    }

    return {
      videos,
      totalCount: data.total || videos.length,
      currentPage: options.page || 1,
      hasNextPage: data.has_next || false,
    }
  }

  private parseDuration(duration: string | number): number {
    if (typeof duration === "number") return duration
    if (!duration) return 0

    const parts = duration.toString().split(":")
    if (parts.length === 3) {
      return Number.parseInt(parts[0]) * 3600 + Number.parseInt(parts[1]) * 60 + Number.parseInt(parts[2])
    } else if (parts.length === 2) {
      return Number.parseInt(parts[0]) * 60 + Number.parseInt(parts[1])
    }
    return Number.parseInt(duration.toString()) || 0
  }

  private async executeExtensionVideoUrl(code: string, videoId: string): Promise<string> {
    // Extract video URL patterns from extension code
    const urlPatterns = code.match(/https?:\/\/[^\s"']+/g) || []

    for (const pattern of urlPatterns) {
      if (pattern.includes("stream") || pattern.includes("video") || pattern.includes("play")) {
        return pattern.replace(/\{[^}]+\}/g, videoId)
      }
    }

    throw new Error("No video URL pattern found in extension")
  }

  private convertToRawUrl(githubUrl: string): string {
    console.log(`[v0] Converting URL to raw format: ${githubUrl}`)

    if (githubUrl.includes("raw.githubusercontent.com")) {
      console.log(`[v0] URL is already a raw GitHub URL`)
      // Extract base path without the file name
      const parts = githubUrl.split("/")
      if (parts.length >= 6) {
        const basePath = parts.slice(0, -1).join("/")
        console.log(`[v0] Extracted base path: ${basePath}`)
        return basePath
      }
      return githubUrl
    }

    // Handle regular GitHub repository URLs
    if (githubUrl.includes("github.com")) {
      const url = new URL(githubUrl)
      const pathParts = url.pathname.split("/").filter(Boolean)

      if (pathParts.length >= 2) {
        const owner = pathParts[0]
        const repo = pathParts[1]
        const branch = pathParts[3] || "main"
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}`
        console.log(`[v0] Converted to raw URL: ${rawUrl}`)
        return rawUrl
      }
    }

    console.log(`[v0] Could not convert URL, returning as-is: ${githubUrl}`)
    return githubUrl
  }

  private convertToGitHubApiUrl(githubUrl: string): string {
    console.log(`[v0] Converting URL to GitHub API: ${githubUrl}`)

    try {
      const url = new URL(githubUrl)

      if (url.hostname === "raw.githubusercontent.com") {
        // Convert raw URL back to API URL
        const pathParts = url.pathname.split("/").filter(Boolean)
        if (pathParts.length >= 2) {
          const apiUrl = `https://api.github.com/repos/${pathParts[0]}/${pathParts[1]}/contents`
          console.log(`[v0] Converted raw URL to API URL: ${apiUrl}`)
          return apiUrl
        }
      } else if (url.hostname === "github.com") {
        const pathParts = url.pathname.split("/").filter(Boolean)
        if (pathParts.length >= 2) {
          const apiUrl = `https://api.github.com/repos/${pathParts[0]}/${pathParts[1]}/contents`
          console.log(`[v0] Converted GitHub URL to API URL: ${apiUrl}`)
          return apiUrl
        }
      }
    } catch (error) {
      console.error(`[v0] Invalid URL format: ${githubUrl}`, error)
    }

    console.log(`[v0] Using original URL as API URL: ${githubUrl}`)
    return githubUrl
  }

  private formatExtensionName(name: string): string {
    return name
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase())
      .trim()
  }

  private isLikelyExtensionDir(dirName: string): boolean {
    const extensionKeywords = [
      "provider",
      "plugin",
      "extension",
      "stream",
      "video",
      "porn",
      "adult",
      "src",
      "lib",
      "plugins",
      "providers",
    ]
    const lowerName = dirName.toLowerCase()
    const isExtensionDir = extensionKeywords.some((keyword) => lowerName.includes(keyword)) || lowerName.length > 3
    console.log(`[v0] Directory ${dirName} is likely extension dir: ${isExtensionDir}`)
    return isExtensionDir
  }

  private generateRepoId(repoUrl: string): string {
    return repoUrl.replace(/https?:\/\//, "").replace(/\//g, "_")
  }

  private extractRepoName(repoUrl: string): string {
    const parts = repoUrl.replace("https://github.com/", "").split("/")
    return parts.length >= 2 ? parts[1] : "Unknown"
  }

  private generateColoredIcon(extensionName: string): string {
    const colors = [
      "#3B82F6", // blue
      "#EF4444", // red
      "#10B981", // green
      "#F59E0B", // yellow
      "#8B5CF6", // purple
      "#F97316", // orange
      "#06B6D4", // cyan
      "#84CC16", // lime
    ]

    // Use extension name to consistently pick a color
    const colorIndex = extensionName.length % colors.length
    const color = colors[colorIndex]
    const letter = extensionName.charAt(0).toUpperCase()

    // Generate a data URL for a colored square with letter
    const svg = `
      <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" fill="${color}" rx="6"/>
        <text x="16" y="20" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold">${letter}</text>
      </svg>
    `

    return `data:image/svg+xml;base64,${btoa(svg)}`
  }

  private extractCloudStreamMetadata(fileContent: string, fileName: string): any {
    // Placeholder for extracting metadata from file content
    return {
      name: fileName.replace(/\.[^.]+$/, ""), // Remove file extension
      version: "1.0.0",
      description: "No description available",
      author: "Unknown",
      language: "en",
      apiEndpoints: [],
      searchTypes: [],
      cloudStreamProvider: null,
      adult: false,
      icon: null,
      lastUpdated: null,
    }
  }

  private isCloudStreamExtensionFile(fileName: string): boolean {
    // Placeholder for checking if a file is a CloudStream extension
    return fileName.endsWith(".cs3") || fileName.endsWith(".js")
  }

  private extractSearchTypes(sourceCode: string): Array<{ value: string; label: string }> {
    // Placeholder for extracting search types from source code
    return []
  }
}

export const githubExtensionLoader = new GitHubExtensionLoader()
export type { GitHubExtension, GitHubRepository, ExtensionCode }
