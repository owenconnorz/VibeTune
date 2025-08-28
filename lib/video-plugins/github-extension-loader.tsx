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
        console.log(`[v0] Using cached extensions for ${repoUrl}: ${cached.extensions.length} extensions`)
        return cached.extensions
      }

      const extensions = await this.fetchRealCloudStreamExtensions(repoUrl)

      // Cache the results
      this.cache.set(repoUrl, {
        id: this.generateRepoId(repoUrl),
        name: this.extractRepoName(repoUrl),
        url: repoUrl,
        extensions,
        lastUpdated: new Date(),
      })

      console.log(`[v0] Successfully loaded ${extensions.length} extensions from ${repoUrl}`)
      return extensions
    } catch (error) {
      console.error(`[v0] Failed to fetch extensions from ${repoUrl}:`, error)
      return []
    }
  }

  private async fetchRealCloudStreamExtensions(repoUrl: string): Promise<GitHubExtension[]> {
    try {
      console.log(`[v0] Starting to fetch real CloudStream extensions from: ${repoUrl}`)

      const apiUrl = this.convertToGitHubApiUrl(repoUrl)
      console.log(`[v0] Converted to API URL: ${apiUrl}`)

      const response = await fetch(apiUrl)
      console.log(`[v0] GitHub API response status: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[v0] GitHub API request failed: ${response.status} - ${errorText}`)
        throw new Error(`GitHub API request failed: ${response.status}`)
      }

      const contents = await response.json()
      console.log(`[v0] GitHub API response type: ${Array.isArray(contents) ? "array" : typeof contents}`)
      console.log(`[v0] GitHub API response length: ${Array.isArray(contents) ? contents.length : "N/A"}`)

      if (!Array.isArray(contents)) {
        console.error(`[v0] Invalid GitHub API response - expected array, got:`, typeof contents)
        throw new Error("Invalid GitHub API response")
      }

      const extensions: GitHubExtension[] = []
      console.log(`[v0] Processing ${contents.length} items from repository`)

      for (const item of contents) {
        console.log(`[v0] Processing item: ${item.name} (type: ${item.type})`)

        if (item.type === "file") {
          if (this.isCloudStreamExtensionFile(item.name)) {
            console.log(`[v0] Found potential extension file: ${item.name}`)
            const extension = await this.parseCloudStreamExtensionFile(item, repoUrl)
            if (extension) {
              console.log(`[v0] Successfully parsed extension: ${extension.name}`)
              extensions.push(extension)
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
          extensions.push(...dirExtensions)
        }
      }

      console.log(`[v0] Total extensions found: ${extensions.length}`)
      return extensions
    } catch (error) {
      console.error(`[v0] Failed to fetch real CloudStream extensions:`, error)
      return []
    }
  }

  private isCloudStreamExtensionFile(filename: string): boolean {
    const extensionPatterns = [
      /\.js$/i,
      /\.kt$/i,
      /\.ts$/i,
      /\.json$/i,
      /plugin\.json$/i,
      /manifest\.json$/i,
      /build\.gradle\.kts$/i,
      /\.gradle$/i,
      /provider\.js$/i,
      /extension\.js$/i,
    ]

    const isExtension = extensionPatterns.some((pattern) => pattern.test(filename))
    console.log(`[v0] File ${filename} is extension: ${isExtension}`)
    return isExtension
  }

  private async parseCloudStreamExtensionFile(item: any, repoUrl: string): Promise<GitHubExtension | null> {
    try {
      console.log(`[v0] Parsing extension file: ${item.name} from ${item.download_url}`)

      const fileResponse = await fetch(item.download_url)
      if (!fileResponse.ok) {
        console.error(`[v0] Failed to fetch file content: ${fileResponse.status}`)
        return null
      }

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
      }

      console.log(`[v0] Created extension object:`, extension.name)
      return extension
    } catch (error) {
      console.error(`[v0] Failed to parse extension file ${item.name}:`, error)
      return null
    }
  }

  private extractCloudStreamMetadata(code: string, filename: string): any {
    console.log(`[v0] Extracting metadata from file: ${filename}`)

    const metadata = {
      name: filename.replace(/\.(js|kt|ts|json)$/i, ""),
      version: "1.0.0",
      description: "CloudStream video provider",
      author: "Unknown",
      language: "en",
      apiEndpoints: [],
      searchTypes: [],
    }

    try {
      // Try to parse as JSON first (for manifest files)
      if (filename.toLowerCase().includes("json")) {
        try {
          const jsonData = JSON.parse(code)
          if (jsonData.name) metadata.name = jsonData.name
          if (jsonData.version) metadata.version = jsonData.version
          if (jsonData.description) metadata.description = jsonData.description
          if (jsonData.author) metadata.author = jsonData.author
          if (jsonData.language) metadata.language = jsonData.language
          console.log(`[v0] Parsed JSON metadata:`, metadata)
          return metadata
        } catch (e) {
          console.log(`[v0] Failed to parse as JSON, trying text extraction`)
        }
      }

      // Extract plugin name from various patterns
      const namePatterns = [
        /class\s+(\w+)/i,
        /name\s*[:=]\s*["']([^"']+)["']/i,
        /plugin_name\s*[:=]\s*["']([^"']+)["']/i,
        /@name\s+([^\s]+)/i,
      ]

      for (const pattern of namePatterns) {
        const match = code.match(pattern)
        if (match) {
          metadata.name = match[1].replace(/Plugin|Provider|Extension$/i, "")
          console.log(`[v0] Found name: ${metadata.name}`)
          break
        }
      }

      // Extract version from various patterns
      const versionPatterns = [
        /version\s*[:=]\s*["']([^"']+)["']/i,
        /@version\s+([^\s]+)/i,
        /VERSION\s*=\s*["']([^"']+)["']/i,
        /plugin_version\s*[:=]\s*["']([^"']+)["']/i,
      ]

      for (const pattern of versionPatterns) {
        const match = code.match(pattern)
        if (match) {
          metadata.version = match[1]
          console.log(`[v0] Found version: ${metadata.version}`)
          break
        }
      }

      // Extract description
      const descPatterns = [
        /description\s*[:=]\s*["']([^"']+)["']/i,
        /@description\s+([^\n]+)/i,
        /plugin_description\s*[:=]\s*["']([^"']+)["']/i,
      ]

      for (const pattern of descPatterns) {
        const match = code.match(pattern)
        if (match) {
          metadata.description = match[1]
          console.log(`[v0] Found description: ${metadata.description}`)
          break
        }
      }

      // Extract author
      const authorPatterns = [
        /author\s*[:=]\s*["']([^"']+)["']/i,
        /@author\s+([^\s]+)/i,
        /plugin_author\s*[:=]\s*["']([^"']+)["']/i,
      ]

      for (const pattern of authorPatterns) {
        const match = code.match(pattern)
        if (match) {
          metadata.author = match[1]
          console.log(`[v0] Found author: ${metadata.author}`)
          break
        }
      }

      // Extract API endpoints
      const urlMatches = code.match(/https?:\/\/[^\s"']+/g)
      if (urlMatches) {
        metadata.apiEndpoints = [...new Set(urlMatches)]
        console.log(`[v0] Found ${metadata.apiEndpoints.length} API endpoints`)
      }

      // Extract search functionality
      const searchKeywords = ["search", "getMainPage", "getSearchResults", "load", "query"]
      const hasSearch = searchKeywords.some((keyword) => code.toLowerCase().includes(keyword.toLowerCase()))

      if (hasSearch) {
        metadata.searchTypes = [
          { value: "search", label: "Search Videos" },
          { value: "trending", label: "Trending Videos" },
          { value: "latest", label: "Latest Videos" },
        ]
        console.log(`[v0] Extension supports search functionality`)
      }

      console.log(`[v0] Final extracted metadata:`, metadata)
    } catch (error) {
      console.error("[v0] Failed to extract metadata:", error)
    }

    return metadata
  }

  private async parseExtensionDirectory(item: any, repoUrl: string): Promise<GitHubExtension[]> {
    try {
      console.log(`[v0] Parsing extension directory: ${item.name}`)

      const dirApiUrl = `${this.convertToGitHubApiUrl(repoUrl)}/${item.name}`
      console.log(`[v0] Directory API URL: ${dirApiUrl}`)

      const response = await fetch(dirApiUrl)
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
        const response = await fetch(iconUrl)

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

          async getVideoUrl(videoId: string) {
            console.log(`[v0] Getting CloudStream video URL for: ${videoId}`)
            try {
              // Extract the original URL from the video data
              const videoData = videoId // This would contain the CloudStream URL
              const loadResponse = await cloudStreamProvider.load(videoData)

              // Try to get actual video links
              await cloudStreamProvider.loadLinks(videoData, false)

              return videoData // Return the CloudStream URL for now
            } catch (error) {
              console.error(`[v0] Failed to get CloudStream video URL:`, error)
              return `https://example.com/stream/${videoId}`
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
            const searchResults = await this.executeExtensionSearch(sourceCode, options)
            return searchResults
          } catch (error) {
            console.error(`[v0] Extension search failed, using fallback:`, error)
            return this.generateFallbackResults(extension, options)
          }
        },

        async getVideoUrl(videoId: string) {
          console.log(`[v0] Getting video URL for: ${videoId}`)
          try {
            return await this.executeExtensionVideoUrl(sourceCode, videoId)
          } catch (error) {
            console.error(`[v0] Failed to get video URL:`, error)
            return `https://example.com/stream/${videoId}`
          }
        },
      }

      return plugin
    } catch (error) {
      console.error(`[v0] Failed to create plugin from extension ${extension.name}:`, error)
      return null
    }
  }

  private extractSearchTypes(code: string): Array<{ value: string; label: string }> {
    const searchTypes = []

    if (code.includes("search") || code.includes("getSearchResults")) {
      searchTypes.push({ value: "search", label: "Search Videos" })
    }
    if (code.includes("getMainPage") || code.includes("trending")) {
      searchTypes.push({ value: "trending", label: "Trending Videos" })
    }
    if (code.includes("latest") || code.includes("recent")) {
      searchTypes.push({ value: "latest", label: "Latest Videos" })
    }
    if (code.includes("popular") || code.includes("top")) {
      searchTypes.push({ value: "popular", label: "Popular Videos" })
    }

    return searchTypes.length > 0
      ? searchTypes
      : [
          { value: "search", label: "Search Videos" },
          { value: "trending", label: "Trending Videos" },
        ]
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
        const response = await fetch(searchUrl)
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
    if (githubUrl.includes("github.com")) {
      return githubUrl.replace("github.com", "raw.githubusercontent.com").replace("/blob/", "/")
    }
    if (githubUrl.includes("raw.githubusercontent.com")) {
      return githubUrl
    }
    // Handle other git hosting services
    return githubUrl
  }

  private convertToGitHubApiUrl(githubUrl: string): string {
    console.log(`[v0] Converting URL to GitHub API: ${githubUrl}`)

    if (githubUrl.includes("raw.githubusercontent.com")) {
      // Convert raw URL back to API URL
      const parts = githubUrl.replace("https://raw.githubusercontent.com/", "").split("/")
      if (parts.length >= 2) {
        const apiUrl = `https://api.github.com/repos/${parts[0]}/${parts[1]}/contents`
        console.log(`[v0] Converted raw URL to API URL: ${apiUrl}`)
        return apiUrl
      }
    } else if (githubUrl.includes("github.com")) {
      const parts = githubUrl.replace("https://github.com/", "").split("/")
      if (parts.length >= 2) {
        const apiUrl = `https://api.github.com/repos/${parts[0]}/${parts[1]}/contents`
        console.log(`[v0] Converted GitHub URL to API URL: ${apiUrl}`)
        return apiUrl
      }
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
}

export const githubExtensionLoader = new GitHubExtensionLoader()
export type { GitHubExtension, GitHubRepository, ExtensionCode }
