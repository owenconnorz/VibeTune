import { NextResponse } from "next/server"
import { cookies } from "next/headers"

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET

export async function POST() {
  try {
    const cookieStore = cookies()
    const authToken = cookieStore.get("auth-token")

    if (!authToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const user = JSON.parse(authToken.value)

    if (!user.refreshToken) {
      return NextResponse.json({ error: "No refresh token" }, { status: 401 })
    }

    // Refresh the access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        refresh_token: user.refreshToken,
        grant_type: "refresh_token",
      }),
    })

    const tokens = await tokenResponse.json()

    if (!tokenResponse.ok) {
      throw new Error(tokens.error_description || "Failed to refresh token")
    }

    // Update user with new access token
    const updatedUser = {
      ...user,
      accessToken: tokens.access_token,
    }

    // Update cookie
    cookieStore.set("auth-token", JSON.stringify(updatedUser), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return NextResponse.json({ accessToken: tokens.access_token })
  } catch (error) {
    console.error("Error refreshing token:", error)
    return NextResponse.json({ error: "Token refresh failed" }, { status: 500 })
  }
}
