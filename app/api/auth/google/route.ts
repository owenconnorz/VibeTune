import { NextResponse } from "next/server"
import YouTubeMusicAuth from "@/lib/auth/youtubeMusicAuth"

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

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
