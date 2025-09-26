import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("[v0] Testing auth configuration...")

    // Check environment variables
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

    const config = {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      hasBaseUrl: !!baseUrl,
      clientIdPreview: clientId ? `${clientId.substring(0, 20)}...` : "Not set",
      baseUrl: baseUrl || "Not set",
      environment: process.env.NODE_ENV || "development",
    }

    console.log("[v0] Auth config:", config)

    // Test Google OAuth URL generation
    const testClientId = clientId || "338253206434-pp4kk32qohilg76pbke4045uchvm13b9.apps.googleusercontent.com"
    const testBaseUrl = baseUrl || "http://localhost:3000"

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${testClientId}&redirect_uri=${testBaseUrl}/api/auth/callback&response_type=code&scope=openid profile email https://www.googleapis.com/auth/youtube.readonly&access_type=offline&prompt=consent`

    return NextResponse.json({
      status: "ok",
      config,
      authUrlGenerated: true,
      authUrlPreview: authUrl.substring(0, 100) + "...",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Auth test error:", error)
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
