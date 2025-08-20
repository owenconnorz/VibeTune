const GITHUB_API_BASE = "https://api.github.com"

export interface GitHubCommit {
  sha: string
  commit: {
    message: string
    author: {
      name: string
      email: string
      date: string
    }
  }
  author: {
    login: string
    avatar_url: string
  } | null
  html_url: string
}

export interface GitHubRelease {
  tag_name: string
  name: string
  body: string
  published_at: string
  html_url: string
}

export class GitHubAPI {
  private owner: string
  private repo: string

  constructor(owner = "user", repo = "vibetune") {
    this.owner = owner
    this.repo = repo
  }

  async getCommits(limit = 10): Promise<GitHubCommit[]> {
    try {
      const response = await fetch(`${GITHUB_API_BASE}/repos/${this.owner}/${this.repo}/commits?per_page=${limit}`, {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "VibeTune-App",
        },
      })

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Failed to fetch commits:", error)
      return []
    }
  }

  async getLatestRelease(): Promise<GitHubRelease | null> {
    try {
      const response = await fetch(`${GITHUB_API_BASE}/repos/${this.owner}/${this.repo}/releases/latest`, {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "VibeTune-App",
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null // No releases found
        }
        throw new Error(`GitHub API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Failed to fetch latest release:", error)
      return null
    }
  }

  async getCommitsSince(since: string): Promise<GitHubCommit[]> {
    try {
      const response = await fetch(
        `${GITHUB_API_BASE}/repos/${this.owner}/${this.repo}/commits?since=${since}&per_page=50`,
        {
          headers: {
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "VibeTune-App",
          },
        },
      )

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Failed to fetch commits since date:", error)
      return []
    }
  }

  setRepository(owner: string, repo: string) {
    this.owner = owner
    this.repo = repo
  }
}

export const githubAPI = new GitHubAPI()
