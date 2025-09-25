import { NextResponse } from "next/server"
import { YouTubeMusicAuth } from "@/lib/youtube-music-auth"

export async function POST() {
  try {
    YouTubeMusicAuth.clearUserSession()

    console.log("[v0] User session cleared successfully")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error logging out:", error)
    return NextResponse.json({ error: "Logout failed" }, { status: 500 })
  }
}
