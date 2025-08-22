import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query") || ""
  const page = searchParams.get("page") || "1"
  const per_page = searchParams.get("per_page") || "20"

  try {
    console.log("[v0] Fetching from eporner API:", { query, page, per_page })

    // Build API URL
    const apiUrl = new URL("https://www.eporner.com/api/v2/video/search/")
    apiUrl.searchParams.set("query", query)
    apiUrl.searchParams.set("per_page", per_page)
    apiUrl.searchParams.set("page", page)
    apiUrl.searchParams.set("thumbsize", "big")
    apiUrl.searchParams.set("order", "latest")
    apiUrl.searchParams.set("gay", "0")
    apiUrl.searchParams.set("lq", "0")
    apiUrl.searchParams.set("format", "json")

    const response = await fetch(apiUrl.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "application/json",
        Referer: "https://www.eporner.com/",
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    })

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`)
    }

    const data = await response.json()
    console.log("[v0] Eporner API response received:", data.total_count || 0, "videos")

    if (data.videos && Array.isArray(data.videos)) {
      const processedVideos = await Promise.all(
        data.videos.map(async (video: any) => {
          try {
            // Try to get video details for direct URLs
            const videoDetailUrl = `https://www.eporner.com/api/v2/video/id/${video.id}?format=json`
            const detailResponse = await fetch(videoDetailUrl, {
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                Accept: "application/json",
                Referer: "https://www.eporner.com/",
              },
            })

            if (detailResponse.ok) {
              const detailData = await detailResponse.json()
              console.log("[v0] Video detail fetched for:", video.id)

              // Extract direct video URLs if available
              const videoSources = detailData.src || {}
              const directUrl = videoSources["720"] || videoSources["480"] || videoSources["360"] || video.url

              return {
                ...video,
                url: directUrl,
                sources: videoSources, // Keep all quality options
              }
            }
          } catch (error) {
            console.log("[v0] Failed to get video details for:", video.id, error)
          }

          return video // Return original if detail fetch fails
        }),
      )

      data.videos = processedVideos
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Eporner API error:", error)

    // Return fallback data on error
    return NextResponse.json({
      total_count: 0,
      count: 0,
      videos: [],
      error: "Failed to fetch videos",
    })
  }
}
