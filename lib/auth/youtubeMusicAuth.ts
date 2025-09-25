interface YouTubeMusicAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  scopes: string[]
}

interface YouTubeMusicTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: string
}

interface YouTubeMusicUser {
  id: string
  email: string
  name: string
  picture: string
  verified: boolean
  channelId?: string
}

class YouTubeMusicAuth {
  private config: YouTubeMusicAuthConfig
  private baseAuthUrl = "https://accounts.google.com/o/oauth2/v2/auth"
  private tokenUrl = "https://oauth2.googleapis.com/token"
  private userInfoUrl = "https://www.googleapis.com/oauth2/v2/userinfo"

  constructor() {
    this.config = {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback`,
      scopes: [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/youtube.readonly",
        "https://www.googleapis.com/auth/youtubepartner",
      ],
    }
  }

  generateAuthUrl(baseUrl: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: `${baseUrl}/api/auth/callback`,
      response_type: "code",
      scope: this.config.scopes.join(" "),
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: "true",
    })

    return `${this.baseAuthUrl}?${params.toString()}`
  }

  async exchangeCodeForTokens(code: string, baseUrl: string): Promise<YouTubeMusicTokens> {
    try {
      const response = await fetch(this.tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code,
          grant_type: "authorization_code",
          redirect_uri: `${baseUrl}/api/auth/callback`,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Token exchange failed: ${error}`)
      }

      const data = await response.json()

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        tokenType: data.token_type,
      }
    } catch (error) {
      console.error("[v0] YouTube Music Auth: Token exchange error:", error)
      throw error
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<YouTubeMusicTokens> {
    try {
      const response = await fetch(this.tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Token refresh failed: ${error}`)
      }

      const data = await response.json()

      return {
        accessToken: data.access_token,
        refreshToken: refreshToken, // Keep the original refresh token
        expiresIn: data.expires_in,
        tokenType: data.token_type,
      }
    } catch (error) {
      console.error("[v0] YouTube Music Auth: Token refresh error:", error)
      throw error
    }
  }

  async getUserInfo(accessToken: string): Promise<YouTubeMusicUser> {
    try {
      const response = await fetch(this.userInfoUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch user info: ${response.statusText}`)
      }

      const data = await response.json()

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        picture: data.picture,
        verified: data.verified_email || false,
      }
    } catch (error) {
      console.error("[v0] YouTube Music Auth: User info error:", error)
      throw error
    }
  }

  async getYouTubeChannelInfo(accessToken: string): Promise<{ channelId?: string; channelTitle?: string }> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=id,snippet&mine=true&key=${process.env.YOUTUBE_API_KEY}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      )

      if (!response.ok) {
        console.warn("[v0] YouTube Music Auth: Could not fetch channel info")
        return {}
      }

      const data = await response.json()
      const channel = data.items?.[0]

      return {
        channelId: channel?.id,
        channelTitle: channel?.snippet?.title,
      }
    } catch (error) {
      console.warn("[v0] YouTube Music Auth: Channel info error:", error)
      return {}
    }
  }

  generateYouTubeMusicCookie(accessToken: string): string {
    // This would typically involve more complex cookie generation
    // For now, we'll use a simplified approach
    return `SAPISID=${accessToken.substring(0, 32)}; HSID=${accessToken.substring(32, 64)}`
  }

  getAuthenticatedSearchContext(accessToken?: string) {
    const baseContext = {
      client: {
        clientName: "WEB_REMIX",
        clientVersion: "1.20241210.01.00",
        hl: "en",
        gl: "US",
      },
      user: {
        lockedSafetyMode: false,
      },
    }

    if (accessToken) {
      return {
        ...baseContext,
        user: {
          ...baseContext.user,
          onBehalfOfUser: accessToken.substring(0, 16),
        },
      }
    }

    return baseContext
  }
}

export default new YouTubeMusicAuth()
export type { YouTubeMusicTokens, YouTubeMusicUser }
