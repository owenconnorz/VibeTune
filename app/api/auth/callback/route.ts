import { type NextRequest, NextResponse } from "next/server"
import { YouTubeMusicAuth } from "@/lib/youtube-music-auth"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

  if (error) {
    console.error("[v0] OAuth error:", error)
    return NextResponse.redirect(new URL("/settings/account?error=oauth_error", request.url))
  }

  if (!code) {
    return NextResponse.redirect(new URL("/settings/account?error=no_code", request.url))
  }

  if (!baseUrl) {
    return NextResponse.redirect(new URL("/settings/account?error=config_error", request.url))
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
