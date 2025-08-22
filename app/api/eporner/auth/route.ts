import { type NextRequest, NextResponse } from "next/server"

interface LoginCredentials {
  username: string
  password: string
}

interface AuthSession {
  cookies: string[]
  timestamp: number
  isValid: boolean
}

// In-memory session storage (in production, use Redis or database)
const authSessions = new Map<string, AuthSession>()

export async function POST(request: NextRequest) {
  try {
    const { username, password }: LoginCredentials = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 })
    }

    console.log("[v0] Attempting eporner login for user:", username)

    // Step 1: Get login page to extract form data and cookies
    const loginPageResponse = await fetch("https://www.eporner.com/login/", {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
    })

    if (!loginPageResponse.ok) {
      console.log("[v0] Failed to fetch login page:", loginPageResponse.status)
      return NextResponse.json({ error: "Failed to access login page" }, { status: 500 })
    }

    const loginPageHtml = await loginPageResponse.text()
    const initialCookies = loginPageResponse.headers.get("set-cookie") || ""

    console.log("[v0] Login page fetched, extracting form data")

    // Extract CSRF token or other form data if needed
    const csrfMatch = loginPageHtml.match(/name="csrf_token"[^>]*value="([^"]*)"/)
    const csrfToken = csrfMatch ? csrfMatch[1] : ""

    // Step 2: Submit login form
    const formData = new URLSearchParams()
    formData.append("username", username)
    formData.append("password", password)
    if (csrfToken) {
      formData.append("csrf_token", csrfToken)
    }
    formData.append("remember", "1") // Remember login
    formData.append("submit", "Login")

    const loginResponse = await fetch("https://www.eporner.com/login/", {
      method: "POST",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "Content-Type": "application/x-www-form-urlencoded",
        Origin: "https://www.eporner.com",
        Referer: "https://www.eporner.com/login/",
        Connection: "keep-alive",
        Cookie: initialCookies,
        "Upgrade-Insecure-Requests": "1",
      },
      body: formData.toString(),
    })

    const loginResponseText = await loginResponse.text()
    const loginCookies = loginResponse.headers.get("set-cookie") || ""

    console.log("[v0] Login response status:", loginResponse.status)
    console.log("[v0] Login response cookies:", loginCookies ? "Present" : "None")

    // Check if login was successful
    const isLoginSuccessful =
      loginResponse.status === 302 || // Redirect after successful login
      loginResponseText.includes("logout") || // Logout link present
      loginResponseText.includes("account") || // Account section present
      !loginResponseText.includes("Invalid username or password") // No error message

    if (!isLoginSuccessful) {
      console.log("[v0] Login failed - invalid credentials or blocked")
      return NextResponse.json({ error: "Login failed - invalid credentials" }, { status: 401 })
    }

    // Store session
    const sessionId = `eporner_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const allCookies = [initialCookies, loginCookies].filter(Boolean)

    authSessions.set(sessionId, {
      cookies: allCookies,
      timestamp: Date.now(),
      isValid: true,
    })

    console.log("[v0] Login successful, session created:", sessionId)

    return NextResponse.json({
      success: true,
      sessionId,
      message: "Successfully logged into eporner",
    })
  } catch (error) {
    console.error("[v0] Eporner auth error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("sessionId")

  if (!sessionId) {
    return NextResponse.json({ error: "Session ID required" }, { status: 400 })
  }

  const session = authSessions.get(sessionId)

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 })
  }

  // Check if session is still valid (24 hours)
  const isExpired = Date.now() - session.timestamp > 24 * 60 * 60 * 1000

  if (isExpired) {
    authSessions.delete(sessionId)
    return NextResponse.json({ error: "Session expired" }, { status: 401 })
  }

  return NextResponse.json({
    isValid: session.isValid,
    timestamp: session.timestamp,
    cookies: session.cookies,
  })
}
