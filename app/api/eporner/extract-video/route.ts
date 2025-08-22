import { type NextRequest, NextResponse } from "next/server"

function base36(hash: string): string {
  if (hash.length >= 32) {
    // Split the hash into 4 parts, convert each part to base36, and concatenate the results
    const part1 = BigInt("0x" + hash.substring(0, 8)).toString(36)
    const part2 = BigInt("0x" + hash.substring(8, 16)).toString(36)
    const part3 = BigInt("0x" + hash.substring(16, 24)).toString(36)
    const part4 = BigInt("0x" + hash.substring(24, 32)).toString(36)
    return part1 + part2 + part3 + part4
  } else {
    throw new Error("Hash length is invalid")
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const videoUrl = searchParams.get("url")

    if (!videoUrl) {
      return NextResponse.json({ success: false, error: "Video URL is required" })
    }

    console.log("[v0] Extracting video from:", videoUrl)

    const response = await fetch(videoUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        Referer: "https://www.eporner.com/",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const html = await response.text()

    const vidMatch = html.match(/EP\.video\.player\.vid = '([^']+)'/)
    const hashMatch = html.match(/EP\.video\.player\.hash = '([^']+)'/)

    if (!vidMatch || !hashMatch) {
      throw new Error("Could not extract video ID or hash from page")
    }

    const vid = vidMatch[1]
    const hash = hashMatch[1]

    console.log("[v0] Extracted vid:", vid, "hash length:", hash.length)

    const base36Hash = base36(hash)
    const apiUrl = `https://www.eporner.com/xhr/video/${vid}?hash=${base36Hash}`

    console.log("[v0] Fetching video sources from:", apiUrl)

    const sourcesResponse = await fetch(apiUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Referer: videoUrl,
        "X-Requested-With": "XMLHttpRequest",
      },
    })

    if (!sourcesResponse.ok) {
      throw new Error(`Sources API error! status: ${sourcesResponse.status}`)
    }

    const sourcesData = await sourcesResponse.json()
    console.log("[v0] Sources data received:", Object.keys(sourcesData))

    const sources = sourcesData.sources?.mp4 || {}
    const videoSources: any[] = []

    Object.keys(sources).forEach((quality) => {
      const source = sources[quality]
      if (source && source.src) {
        videoSources.push({
          quality: source.labelShort || quality,
          url: source.src,
          type: "mp4",
        })
      }
    })

    console.log("[v0] Extracted video sources:", videoSources.length)

    if (videoSources.length === 0) {
      throw new Error("No video sources found")
    }

    const bestSource =
      videoSources.find((s) => s.quality.includes("1080")) ||
      videoSources.find((s) => s.quality.includes("720")) ||
      videoSources[0]

    return NextResponse.json({
      success: true,
      videoUrl: bestSource.url,
      sources: videoSources,
      vid: vid,
      hash: hash,
    })
  } catch (error) {
    console.error("[v0] Video extraction error:", error)

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
