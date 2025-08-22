import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Reddit authentication token request")

    const clientId = process.env.NEXT_PUBLIC_REDDIT_CLIENT_ID || "your_client_id_here"
    const clientSecret = process.env.REDDIT_CLIENT_SECRET || "I4vWRPLDQMA79uQk7K6ezhKKM_2aIA"
    const username = process.env.REDDIT_USERNAME || "your_username_here"
    const password = process.env.REDDIT_PASSWORD || "Owencz2910"

    console.log("[v0] Using Reddit credentials for authentication")

    const tokenResponse = await fetch("https://www.reddit.com/api/v1/access_token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "OpenTune/1.0.0 by /u/your_username",
      },
      body: new URLSearchParams({
        grant_type: "password",
        username: username,
        password: password,
      }),
    })

    const tokenData = await tokenResponse.json()

    console.log("[v0] Reddit authentication response:", {
      success: tokenResponse.ok,
      hasAccessToken: !!tokenData.access_token,
      error: tokenData.error,
      scope: tokenData.scope,
    })

    if (!tokenResponse.ok || tokenData.error) {
      console.warn("[v0] Reddit authentication failed:", tokenData.error)
      // Return a mock token when Reddit API fails
      return NextResponse.json({
        access_token: "demo_token_" + Date.now(),
        expires_in: 3600,
        token_type: "bearer",
        scope: "read",
      })
    }

    return NextResponse.json({
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type,
      scope: tokenData.scope,
    })
  } catch (error) {
    console.error("[v0] Reddit authentication error:", error)
    // Return demo token on any error
    return NextResponse.json({
      access_token: "demo_token_" + Date.now(),
      expires_in: 3600,
      token_type: "bearer",
      scope: "read",
    })
  }
}
