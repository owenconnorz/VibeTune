import { type NextRequest, NextResponse } from "next/server"
import * as cheerio from "cheerio"

export async function POST(request: NextRequest) {
  try {
    const { videoUrl } = await request.json()

    if (!videoUrl || !videoUrl.includes("eporner.com")) {
      console.log("[v0] Invalid URL provided:", videoUrl)
      return NextResponse.json({ error: "Invalid eporner URL" }, { status: 400 })
    }

    console.log("[v0] Starting extraction for URL:", videoUrl)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      console.log("[v0] Request timeout after 10 seconds")
      controller.abort()
    }, 10000)

    console.log("[v0] Fetching eporner page with headers...")
    const response = await fetch(videoUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        DNT: "1",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        Referer: "https://www.eporner.com/",
      },
    })

    clearTimeout(timeoutId)

    console.log("[v0] Response status:", response.status, response.statusText)
    console.log("[v0] Response headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      console.log("[v0] Failed to fetch eporner page:", response.status, response.statusText)
      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch video page: ${response.status} ${response.statusText}`,
        },
        { status: 500 },
      )
    }

    const html = await response.text()
    console.log("[v0] Fetched HTML length:", html.length)
    console.log("[v0] HTML preview (first 500 chars):", html.substring(0, 500))

    const $ = cheerio.load(html)

    // Multiple extraction strategies
    let directVideoUrl = null
    let extractionMethod = ""
    const foundUrls: string[] = []

    console.log("[v0] Scanning", $("script").length, "script tags for video URLs...")
    $("script").each((index, element) => {
      const scriptContent = $(element).html() || ""
      console.log(`[v0] Script ${index + 1} length:`, scriptContent.length)

      // Look for common video URL patterns
      const videoPatterns = [
        { name: "mp4", pattern: /["']([^"']*\.mp4[^"']*?)["']/gi },
        { name: "m3u8", pattern: /["']([^"']*\.m3u8[^"']*?)["']/gi },
        { name: "webm", pattern: /["']([^"']*\.webm[^"']*?)["']/gi },
        { name: "video_url", pattern: /video_url['":\s]*["']([^"']+)["']/gi },
        { name: "mp4_key", pattern: /mp4['":\s]*["']([^"']+)["']/gi },
        { name: "source", pattern: /source['":\s]*["']([^"']+)["']/gi },
        { name: "file", pattern: /file['":\s]*["']([^"']+\.mp4[^"']*?)["']/gi },
        { name: "src", pattern: /src['":\s]*["']([^"']+\.mp4[^"']*?)["']/gi },
      ]

      for (const { name, pattern } of videoPatterns) {
        const matches = [...scriptContent.matchAll(pattern)]
        console.log(`[v0] Pattern "${name}" found ${matches.length} matches in script ${index + 1}`)

        for (const match of matches) {
          const url = match[1]
          foundUrls.push(`${name}: ${url}`)

          if (
            url &&
            (url.includes(".mp4") || url.includes(".m3u8") || url.includes(".webm")) &&
            (url.startsWith("http") || url.startsWith("//"))
          ) {
            directVideoUrl = url.startsWith("//") ? `https:${url}` : url
            extractionMethod = `script pattern (${name})`
            console.log("[v0] ✓ Found valid video URL via", extractionMethod, ":", directVideoUrl)
            return false // Break out of each loop
          }
        }
      }
    })

    // Strategy 2: Look for video elements
    if (!directVideoUrl) {
      $("video source, video").each((_, element) => {
        const src = $(element).attr("src") || $(element).attr("data-src")
        if (src && src.startsWith("http") && (src.includes(".mp4") || src.includes(".m3u8") || src.includes(".webm"))) {
          directVideoUrl = src
          extractionMethod = "video element"
          console.log("[v0] ✓ Found video URL via video element:", src)
          return false
        }
      })
    }

    // Strategy 3: Look for JSON-LD structured data
    if (!directVideoUrl) {
      $('script[type="application/ld+json"]').each((_, element) => {
        try {
          const jsonData = JSON.parse($(element).html() || "{}")
          if (jsonData.contentUrl || jsonData.embedUrl) {
            const url = jsonData.contentUrl || jsonData.embedUrl
            if (
              url &&
              url.startsWith("http") &&
              (url.includes(".mp4") || url.includes(".m3u8") || url.includes(".webm"))
            ) {
              directVideoUrl = url
              extractionMethod = "JSON-LD"
              console.log("[v0] ✓ Found video URL via JSON-LD:", url)
              return false
            }
          }
        } catch (e) {
          // Ignore JSON parse errors
        }
      })
    }

    console.log("[v0] All URLs found during extraction:", foundUrls)

    if (directVideoUrl) {
      console.log("[v0] ✓ Successfully extracted video URL via", extractionMethod, ":", directVideoUrl)
      return NextResponse.json({
        success: true,
        videoUrl: directVideoUrl,
        originalUrl: videoUrl,
        method: extractionMethod,
      })
    } else {
      console.log("[v0] ✗ No direct video URL found in page")
      console.log("[v0] Page title:", $("title").text())
      console.log("[v0] Found script tags:", $("script").length)
      console.log("[v0] Found video elements:", $("video").length)
      console.log("[v0] All potential URLs found:", foundUrls)

      return NextResponse.json({
        success: false,
        error: "No direct video URL found",
        originalUrl: videoUrl,
        debug: {
          pageTitle: $("title").text(),
          scriptTags: $("script").length,
          videoElements: $("video").length,
          foundUrls: foundUrls,
          htmlPreview: html.substring(0, 1000),
        },
      })
    }
  } catch (error) {
    console.error("[v0] Video extraction error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Extraction failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
