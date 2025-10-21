import { type NextRequest, NextResponse } from "next/server"
import { PIPED_INSTANCES } from "@/lib/piped-storage"

// Cache for successful responses
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Rate limiting per instance
const instanceLastRequest = new Map<string, number>()
const MIN_REQUEST_INTERVAL = 1000 // 1 second between requests to same instance

async function fetchWithProxy(instanceUrl: string, path: string): Promise<any> {
  // Rate limiting
  const lastRequest = instanceLastRequest.get(instanceUrl) || 0
  const timeSinceLastRequest = Date.now() - lastRequest
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise((resolve) => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest))
  }
  instanceLastRequest.set(instanceUrl, Date.now())

  const url = `${instanceUrl}${path}`

  // Browser-like headers to bypass Cloudflare
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    Referer: instanceUrl,
    Origin: instanceUrl,
    DNT: "1",
    Connection: "keep-alive",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  }

  console.log(`[v0] Proxy fetching: ${url}`)

  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(10000), // 10 second timeout
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const contentType = response.headers.get("content-type")
  if (!contentType?.includes("application/json")) {
    throw new Error("Non-JSON response (likely Cloudflare block)")
  }

  return await response.json()
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const path = searchParams.get("path")

  if (!path) {
    return NextResponse.json({ error: "Missing path parameter" }, { status: 400 })
  }

  // Check cache
  const cacheKey = path
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`[v0] Proxy cache hit: ${path}`)
    return NextResponse.json(cached.data)
  }

  // Try each instance
  const errors: string[] = []

  for (const instance of PIPED_INSTANCES) {
    try {
      const data = await fetchWithProxy(instance.url, path)

      // Cache successful response
      cache.set(cacheKey, { data, timestamp: Date.now() })

      console.log(`[v0] Proxy success: ${instance.url}${path}`)
      return NextResponse.json(data)
    } catch (error: any) {
      const errorMsg = `${instance.url}: ${error.message}`
      console.log(`[v0] Proxy failed: ${errorMsg}`)
      errors.push(errorMsg)

      // Add delay before trying next instance
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  // All instances failed
  console.log(`[v0] Proxy: All instances failed for ${path}`)
  return NextResponse.json(
    {
      error: "All Piped instances failed",
      details: errors,
      path,
    },
    { status: 503 },
  )
}
