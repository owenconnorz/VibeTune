import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get("url")
    const sessionId = request.nextUrl.searchParams.get("sessionId")

    if (!url) {
      return NextResponse.json({ error: "URL parameter required" }, { status: 400 })
    }

    console.log("[v0] Proxying eporner URL:", url)

    let authCookies = ""

    // If session ID provided, get authenticated cookies
    if (sessionId) {
      try {
        const authResponse = await fetch(`${request.nextUrl.origin}/api/eporner/auth?sessionId=${sessionId}`)
        if (authResponse.ok) {
          const authData = await authResponse.json()
          if (authData.isValid && authData.cookies) {
            authCookies = authData.cookies.join("; ")
            console.log("[v0] Using authenticated session for proxy request")
          }
        }
      } catch (error) {
        console.log("[v0] Failed to get auth session, proceeding without authentication")
      }
    }

    // Fetch the eporner page with authentication if available
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        Referer: "https://www.eporner.com/",
        ...(authCookies && { Cookie: authCookies }),
      },
    })

    if (!response.ok) {
      console.log("[v0] Proxy request failed:", response.status)
      return NextResponse.json({ error: "Failed to fetch content" }, { status: response.status })
    }

    const content = await response.text()
    const contentType = response.headers.get("content-type") || "text/html"

    console.log("[v0] Successfully proxied eporner page, content length:", content.length)

    // Check if we got age verification page
    if (content.includes("ageverifybox") || content.includes("Age Verification")) {
      console.log("[v0] Received age verification page despite authentication")

      // If we have auth cookies, this might be a different verification step
      if (authCookies) {
        console.log("[v0] Authenticated user still seeing verification - may need additional steps")
      }
    } else {
      console.log("[v0] Successfully bypassed age verification with authentication")
    }

    // Modify headers to allow embedding
    const modifiedContent = content
      .replace(/<meta[^>]*http-equiv=["']X-Frame-Options["'][^>]*>/gi, "")
      .replace(/X-Frame-Options:\s*[^;]+;?/gi, "")
      .replace(/frame-ancestors[^;]*;?/gi, "")

    const headers = new Headers()
    headers.set("Content-Type", contentType)
    headers.set("Cache-Control", "no-cache")
    headers.set("X-Frame-Options", "ALLOWALL")
    headers.set("Content-Security-Policy", "frame-ancestors *")

    return new NextResponse(modifiedContent, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error("[v0] Eporner proxy error:", error)
    return NextResponse.json({ error: "Proxy request failed" }, { status: 500 })
  }
}
