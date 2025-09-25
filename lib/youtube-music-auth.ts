// YouTube Music authentication helper based on SimpMusic's approach
import { cookies } from "next/headers"

export interface YouTubeMusicUser {
  id: string
  email: string
  name: string
  picture: string
  accessToken: string
  refreshToken: string
  ytmusicCookies?: string
  ytmusicHeaders?: Record<string, string>
}

export class YouTubeMusicAuth {
  private static readonly YOUTUBE_MUSIC_SCOPES = [
    "openid",
    "profile",
    "email",
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/youtubepartner",
    "https://www.googleapis.com/auth/youtube.force-ssl",
  ]

  static generateAuthUrl(baseUrl: string): string {
    const clientId = process.env.GOOGLE_CLIENT_ID
    if (!clientId) {
      throw new Error("Google OAuth not configured")
    }

    const redirectUri = `${baseUrl}/api/auth/callback`
    const scopes = this.YOUTUBE_MUSIC_SCOPES.join(" ")

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: scopes,
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: "true",
    })

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  }

  static async exchangeCodeForTokens(code: string, baseUrl: string): Promise<YouTubeMusicUser> {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = `${baseUrl}/api/auth/callback`

    if (!clientId || !clientSecret) {
      throw new Error("Google OAuth credentials not configured")
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    })

    const tokens = await tokenResponse.json()

    if (!tokenResponse.ok) {
      throw new Error(tokens.error_description || "Failed to exchange code for tokens")
    }

    // Get user info from Google
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })

    const userInfo = await userResponse.json()

    if (!userResponse.ok) {
      throw new Error("Failed to fetch user info")
    }

    // Validate YouTube Music access
    const ytMusicAccess = await this.validateYouTubeMusicAccess(tokens.access_token)

    const user: YouTubeMusicUser = {
      id: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      ytmusicCookies: ytMusicAccess.cookies,
      ytmusicHeaders: ytMusicAccess.headers,
    }

    return user
  }

  private static async validateYouTubeMusicAccess(accessToken: string): Promise<{
    cookies?: string
    headers?: Record<string, string>
  }> {
    try {
      // Test YouTube Music API access
      const testResponse = await fetch(
        "https://music.youtube.com/youtubei/v1/browse?key=AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            Origin: "https://music.youtube.com",
            Referer: "https://music.youtube.com/",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          },
          body: JSON.stringify({
            context: {
              client: {
                clientName: "WEB_REMIX",
                clientVersion: "1.20241202.01.00",
              },
            },
            browseId: "FEmusic_home",
          }),
        },
      )

      if (testResponse.ok) {
        console.log("[v0] YouTube Music API access validated successfully")

        // Extract cookies and headers for future requests
        const cookies = testResponse.headers.get("set-cookie")
        const headers = {
          Authorization: `Bearer ${accessToken}`,
          "X-Goog-AuthUser": "0",
          "X-Youtube-Bootstrap-Logged-In": "true",
        }

        return { cookies: cookies || undefined, headers }
      } else {
        console.warn("[v0] YouTube Music API access validation failed:", testResponse.status)
        return {}
      }
    } catch (error) {
      console.error("[v0] YouTube Music API validation error:", error)
      return {}
    }
  }

  static async refreshAccessToken(refreshToken: string): Promise<string> {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      throw new Error("Google OAuth credentials not configured")
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    })

    const tokens = await tokenResponse.json()

    if (!tokenResponse.ok) {
      throw new Error(tokens.error_description || "Failed to refresh token")
    }

    // Validate the new token with YouTube Music
    await this.validateYouTubeMusicAccess(tokens.access_token)

    return tokens.access_token
  }

  static async getAuthenticatedUser(): Promise<YouTubeMusicUser | null> {
    try {
      const cookieStore = cookies()
      const authToken = cookieStore.get("auth-token")

      if (!authToken) {
        return null
      }

      const user = JSON.parse(authToken.value) as YouTubeMusicUser

      // Check if token needs refresh (basic check)
      const tokenAge = Date.now() - (user as any).tokenTimestamp
      if (tokenAge > 3600000) {
        // 1 hour
        try {
          const newAccessToken = await this.refreshAccessToken(user.refreshToken)
          user.accessToken = newAccessToken
          ;(user as any).tokenTimestamp = Date.now()

          // Update cookie
          cookieStore.set("auth-token", JSON.stringify(user), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 days
          })
        } catch (error) {
          console.error("[v0] Token refresh failed:", error)
          return null
        }
      }

      return user
    } catch (error) {
      console.error("[v0] Error getting authenticated user:", error)
      return null
    }
  }

  static storeUserSession(user: YouTubeMusicUser): void {
    const cookieStore = cookies()
    const userWithTimestamp = {
      ...user,
      tokenTimestamp: Date.now(),
    }

    cookieStore.set("auth-token", JSON.stringify(userWithTimestamp), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
  }

  static clearUserSession(): void {
    const cookieStore = cookies()
    cookieStore.delete("auth-token")
  }
}
