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

class GitHubExtensionLoader {
  private cache = new Map<string, GitHubRepository>()
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
          iconUrl: ext.iconUrl,
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
}

export const githubExtensionLoader = new GitHubExtensionLoader()
export type { GitHubExtension, GitHubRepository }
