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

const FALLBACK_COMMITS: GitHubCommit[] = [
  {
    sha: "abc123",
    commit: {
      message: "Added custom profile picture functionality",
      author: {
        name: "VibeTune Dev",
        email: "dev@vibetune.app",
        date: new Date().toISOString(),
      },
    },
    author: {
      login: "vibetune-dev",
      avatar_url: "/diverse-profile-avatars.png",
    },
    html_url: "#",
  },
  {
    sha: "def456",
    commit: {
      message: "Improved song menu layout and styling",
      author: {
        name: "VibeTune Dev",
        email: "dev@vibetune.app",
        date: new Date(Date.now() - 86400000).toISOString(),
      },
    },
    author: {
      login: "vibetune-dev",
      avatar_url: "/diverse-profile-avatars.png",
    },
    html_url: "#",
  },
]

export class GitHubAPI {
  private owner: string
  private repo: string
  private rateLimited = false
  private rateLimitReset = 0

  constructor(owner = "vercel", repo = "v0") {
    this.owner = owner
    this.repo = repo
  }

  private isRateLimited(): boolean {
    const now = Date.now()
    if (now > this.rateLimitReset) {
      this.rateLimited = false
    }
    return this.rateLimited
  }

  private handleRateLimit(response: Response): void {
    if (response.status === 403) {
      const resetHeader = response.headers.get("X-RateLimit-Reset")
      if (resetHeader) {
        this.rateLimitReset = Number.parseInt(resetHeader) * 1000
        this.rateLimited = true
      }
    }
  }

  async getCommits(limit = 10): Promise<GitHubCommit[]> {
    if (this.isRateLimited()) {
      return FALLBACK_COMMITS.slice(0, limit)
    }

    try {
      const response = await fetch(`${GITHUB_API_BASE}/repos/${this.owner}/${this.repo}/commits?per_page=${limit}`, {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "VibeTune-App",
        },
      })

      this.handleRateLimit(response)

      if (!response.ok) {
        if (response.status === 403 || response.status === 404) {
          return FALLBACK_COMMITS.slice(0, limit)
        }
        throw new Error(`GitHub API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      return FALLBACK_COMMITS.slice(0, limit)
    }
  }

  async getLatestRelease(): Promise<GitHubRelease | null> {
    if (this.isRateLimited()) {
      return null
    }

    try {
      const response = await fetch(`${GITHUB_API_BASE}/repos/${this.owner}/${this.repo}/releases/latest`, {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "VibeTune-App",
        },
      })

      this.handleRateLimit(response)

      if (!response.ok) {
        return null // No releases found or rate limited
      }

      return await response.json()
    } catch (error) {
      return null
    }
  }

  async getCommitsSince(since: string): Promise<GitHubCommit[]> {
    if (this.isRateLimited()) {
      return FALLBACK_COMMITS
    }

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

      this.handleRateLimit(response)

      if (!response.ok) {
        if (response.status === 403 || response.status === 404) {
          return FALLBACK_COMMITS
        }
        throw new Error(`GitHub API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      return FALLBACK_COMMITS
    }
  }

  setRepository(owner: string, repo: string) {
    this.owner = owner
    this.repo = repo
  }
}

export const githubAPI = new GitHubAPI()
