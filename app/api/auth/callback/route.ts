import { type NextRequest, NextResponse } from "next/server"
import { YouTubeMusicAuth } from "@/lib/youtube-music-auth"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`

  console.log("[v0] OAuth callback - Base URL:", baseUrl)

  if (error) {
    console.error("[v0] OAuth error:", error)
    return NextResponse.redirect(new URL("/settings/account?error=oauth_error", request.url))
  }

  if (!code) {
    console.error("[v0] OAuth callback: No authorization code received")
    return NextResponse.redirect(new URL("/settings/account?error=no_code", request.url))
  }

  try {
    console.log("[v0] Processing OAuth callback with enhanced YouTube Music auth")

    const user = await YouTubeMusicAuth.exchangeCodeForTokens(code, baseUrl)

    YouTubeMusicAuth.storeUserSession(user)

    console.log("[v0] YouTube Music authentication successful for user:", user.email)
    return NextResponse.redirect(new URL("/settings/account?success=connected", request.url))
  } catch (error) {
    console.error("[v0] Enhanced OAuth callback error:", error)
    return NextResponse.redirect(new URL("/settings/account?error=callback_failed", request.url))
  }
}
