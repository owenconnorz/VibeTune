export class RedditAuthService {
  private static instance: RedditAuthService
  private accessToken: string | null = null
  private tokenExpiry: number | null = null

  static getInstance(): RedditAuthService {
    if (!RedditAuthService.instance) {
      RedditAuthService.instance = new RedditAuthService()
    }
    return RedditAuthService.instance
  }

  async getUserToken(): Promise<string | null> {
    try {
      const response = await fetch("/api/reddit/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        console.warn("Failed to get Reddit user token")
        return null
      }

      const data = await response.json()

      this.accessToken = data.access_token
      this.tokenExpiry = Date.now() + data.expires_in * 1000

      console.log("[v0] Reddit user token obtained, scope:", data.scope)

      return this.accessToken
    } catch (error) {
      console.error("User token error:", error)
      return null
    }
  }

  async isAuthenticated(): Promise<boolean> {
    // Check if current token is still valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return true
    }

    const token = await this.getUserToken()
    return !!token
  }

  async getAccessToken(): Promise<string | null> {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    return await this.getUserToken()
  }

  logout(): void {
    this.accessToken = null
    this.tokenExpiry = null
  }
}
