import { NextResponse } from "next/server"
import { YouTubeMusicAuth } from "@/lib/youtube-music-auth"

export async function GET() {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

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

    console.log("[v0] Google OAuth: Initiating authentication flow")

    const authUrl = YouTubeMusicAuth.generateAuthUrl(baseUrl)
    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error("[v0] Google OAuth initiation error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "OAuth configuration error",
      },
      { status: 500 },
    )
  }
}
