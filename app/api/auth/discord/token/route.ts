import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ error: "No code provided" }, { status: 400 })
    }

    const clientId = "1234567890123456789" // Replace with your Discord app client ID
    const clientSecret = process.env.DISCORD_CLIENT_SECRET // Add this to your environment variables
    const redirectUri = `${request.nextUrl.origin}/auth/discord/callback`

    // Exchange code for access token
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret || "",
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      return NextResponse.json({ error: tokenData.error }, { status: 400 })
    }

    return NextResponse.json(tokenData)
  } catch (error) {
    console.error("[v0] Discord token exchange error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
