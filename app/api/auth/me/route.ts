import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = cookies()
    const authToken = cookieStore.get("auth-token")

    if (!authToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const user = JSON.parse(authToken.value)

    // Remove sensitive tokens from response
    const { accessToken, refreshToken, ...safeUser } = user

    return NextResponse.json(safeUser)
  } catch (error) {
    console.error("Error getting user:", error)
    return NextResponse.json({ error: "Invalid session" }, { status: 401 })
  }
}
