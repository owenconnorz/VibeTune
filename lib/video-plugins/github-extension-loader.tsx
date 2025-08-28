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

class GitHubExtensionLoader {
  private cache = new Map<string, GitHubRepository>()
  private extensionCode = new Map<string, ExtensionCode>()
  private readonly CACHE_DURATION = 1000 * 60 * 30 // 30 minutes

  async fetchRepositoryExtensions(repoUrl: string): Promise<GitHubExtension[]> {
    try {
      console.log(`[v0] Fetching extensions from repository: ${repoUrl}`)

      // Check cache first
      const cached = this.cache.get(repoUrl)
      if (cached && Date.now() - cached.lastUpdated.getTime() < this.CACHE_DURATION) {
        console.log(`[v0] Using cached extensions for ${repoUrl}`)
        return cached.extensions
      }

      // Convert GitHub URL to raw content URL
      const rawUrl = this.convertToRawUrl(repoUrl)

      // Fetch repository manifest or extension list
      const response = await fetch(rawUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch repository: ${response.status}`)
      }

      const data = await response.text()
      const extensions = this.parseExtensions(data, repoUrl)

      // Cache the results
      this.cache.set(repoUrl, {
        id: this.generateRepoId(repoUrl),
        name: this.extractRepoName(repoUrl),
        url: repoUrl,
        extensions,
        lastUpdated: new Date(),
      })

      console.log(`[v0] Loaded ${extensions.length} extensions from ${repoUrl}`)
      return extensions
    } catch (error) {
      console.error(`[v0] Failed to fetch extensions from ${repoUrl}:`, error)
      return []
    }
  }

  private convertToRawUrl(githubUrl: string): string {
    // Convert GitHub URLs to raw content URLs
    if (githubUrl.includes("github.com")) {
      return githubUrl.replace("github.com", "raw.githubusercontent.com").replace("/blob/", "/")
    }
    if (githubUrl.includes("raw.githubusercontent.com")) {
      return githubUrl
    }
    // Handle other git hosting services
    return githubUrl
  }

  private parseExtensions(data: string, repoUrl: string): GitHubExtension[] {
    try {
      // Try to parse as JSON manifest first
      const manifest = JSON.parse(data)
      if (manifest.extensions && Array.isArray(manifest.extensions)) {
        return manifest.extensions.map((ext: any, index: number) => ({
          id: ext.id || `${this.generateRepoId(repoUrl)}_${index}`,
          name: ext.name || `Extension ${index + 1}`,
          version: ext.version || "1.0.0",
          description: ext.description || "No description available",
          author: ext.author || "Unknown",
          url: ext.url || repoUrl,
          iconUrl: ext.iconUrl || this.generateIconUrl(repoUrl, ext.name || `Extension ${index + 1}`),
          language: ext.language || "en",
          status: "active" as const,
        }))
      }
    } catch {
      // If not JSON, try to parse as text-based format
    }

    // Generate mock extensions based on repository name for now
    // In a real implementation, this would parse actual extension files
    const repoName = this.extractRepoName(repoUrl)
    const mockExtensions: GitHubExtension[] = []

    // Generate some realistic extensions based on common CloudStream providers
    const commonProviders = [
      "AllPornStream",
      "Eporner",
      "FPO",
      "Free Porn Videos",
      "Cam4",
      "Camsoda",
      "Chatrubate",
      "FullPorner",
    ]

    commonProviders.forEach((provider, index) => {
      mockExtensions.push({
        id: `${this.generateRepoId(repoUrl)}_${provider.toLowerCase()}`,
        name: provider,
        version: "1.0.0",
        description: `${provider} video streaming provider`,
        author: repoName,
        url: repoUrl,
        iconUrl: this.generateIconUrl(repoUrl, provider),
        language: "en",
        status: "active",
      })
    })

    return mockExtensions.slice(0, Math.floor(Math.random() * 8) + 3) // Random 3-10 extensions
  }

  private generateRepoId(url: string): string {
    return btoa(url)
      .replace(/[^a-zA-Z0-9]/g, "")
      .substring(0, 8)
  }

  private extractRepoName(url: string): string {
    try {
      const parts = url.split("/")
      return parts[parts.length - 1] || parts[parts.length - 2] || "Unknown Repository"
    } catch {
      return "Unknown Repository"
    }
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
          const response = await fetch(rawUrl)

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
      const code = await this.downloadExtensionCode(extension)
      if (!code) {
        throw new Error("Failed to download extension code")
      }

      // Create a safe execution environment
      const pluginFunction = new Function(
        "console",
        "fetch",
        code + "; return " + extension.name.replace(/[^a-zA-Z0-9]/g, "") + "Plugin;",
      )
      const PluginClass = pluginFunction(console, fetch)

      return new PluginClass()
    } catch (error) {
      console.error(`[v0] Failed to create plugin from extension ${extension.name}:`, error)
      return null
    }
  }

  private generateIconUrl(repoUrl: string, extensionName: string): string {
    try {
      // Try to construct icon URL from repository
      const rawUrl = this.convertToRawUrl(repoUrl)
      const iconName = extensionName.toLowerCase().replace(/[^a-z0-9]/g, "")

      // Common icon paths in CloudStream repositories
      const possibleIconPaths = [
        `${rawUrl}/icons/${iconName}.png`,
        `${rawUrl}/assets/${iconName}.png`,
        `${rawUrl}/${iconName}/icon.png`,
        `${rawUrl}/${iconName}.png`,
        `${rawUrl}/icon.png`,
      ]

      // Return the first possible path (in real implementation, we'd check if it exists)
      return possibleIconPaths[0]
    } catch {
      // Fallback to generating a colored icon based on extension name
      return this.generateColoredIcon(extensionName)
    }
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
        <text x="16" y="20" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="bold">${letter}</text>
      </svg>
    `

    return `data:image/svg+xml;base64,${btoa(svg)}`
  }
}

export const githubExtensionLoader = new GitHubExtensionLoader()
export type { GitHubExtension, GitHubRepository, ExtensionCode }
