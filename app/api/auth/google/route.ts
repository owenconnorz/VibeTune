import { NextResponse } from "next/server"
import { YouTubeMusicAuth } from "@/lib/youtube-music-auth"

export async function GET() {
  try {
    console.log("[v0] Google OAuth: Starting authentication flow")

    const clientId =
      process.env.GOOGLE_CLIENT_ID || "338253206434-pp4kk32qohilg76pbke4045uchvm13b9.apps.googleusercontent.com"
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "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"
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

    console.log("[v0] Google OAuth config:", {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      baseUrl,
      clientIdPreview: clientId.substring(0, 20) + "...",
    })

    if (!clientId || !clientSecret) {
      console.error("[v0] Google OAuth: Missing required environment variables")
      return NextResponse.json(
        {
          error: "Google OAuth not configured",
          details: "Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variables",
          setup: "Please add these environment variables in your Vercel project settings",
        },
        { status: 500 },
      )
    }

    console.log("[v0] Google OAuth: Generating auth URL...")

    const authUrl = YouTubeMusicAuth.generateAuthUrl(baseUrl)

    console.log("[v0] Google OAuth: Auth URL generated successfully")
    console.log("[v0] Redirecting to:", authUrl.substring(0, 100) + "...")

    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error("[v0] Google OAuth initiation error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "OAuth configuration error",
        details: "Check server logs for more information",
      },
      { status: 500 },
    )
  }
}
