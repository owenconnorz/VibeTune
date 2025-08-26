import { type NextRequest, NextResponse } from "next/server"

interface EpornerSearchParams {
  query?: string
  page?: string
  per_page?: string
  order?: "latest" | "longest" | "shortest" | "top-weekly" | "top-monthly" | "top-alltime"
  gay?: "0" | "1" | "2" // 0=straight, 1=gay, 2=all
  lq?: "0" | "1" // low quality flag
  format?: "json"
  thumbsize?: "small" | "medium" | "big"
  category?: string
  duration?: "longest" | "shortest"
  section?: "etero" | "gay" | string
  searchType?: "1" | "2" | "3" | "4" | "5" | "6" // 1=category, 2=keyword, 3=duration, 4=section, 5=home, 6=trending
}

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)

      // If we get a 502, retry with exponential backoff
      if (response.status === 502 && attempt < maxRetries) {
        console.log(`[v0] Eporner API 502 error, retrying attempt ${attempt + 1}/${maxRetries}`)
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        continue
      }

      return response
    } catch (error) {
      if (attempt === maxRetries) throw error
      console.log(`[v0] Eporner API request failed, retrying attempt ${attempt + 1}/${maxRetries}`)
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000))
    }
  }

  throw new Error("Max retries exceeded")
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const params: EpornerSearchParams = {
    query: searchParams.get("query") || "",
    page: searchParams.get("page") || "1",
    per_page: searchParams.get("per_page") || "30",
    order: (searchParams.get("order") as any) || "latest",
    gay: (searchParams.get("gay") as any) || "0",
    lq: (searchParams.get("lq") as any) || "0",
    format: "json",
    thumbsize: (searchParams.get("thumbsize") as any) || "big",
    category: searchParams.get("category") || "",
    duration: (searchParams.get("duration") as any) || "",
    section: searchParams.get("section") || "",
    searchType: (searchParams.get("searchType") as any) || "2",
  }

  try {
    console.log("[v0] Fetching from eporner API with enhanced params:", params)

    const endpoints = ["https://www.eporner.com/api/v2/video/search/", "https://eporner.com/api/v2/video/search/"]

    let response: Response | null = null
    let lastError: Error | null = null

    for (const baseUrl of endpoints) {
      try {
        const apiUrl = new URL(baseUrl)

        switch (params.searchType) {
          case "1": // Category search
            if (params.category) {
              apiUrl.searchParams.set("query", params.category)
            }
            apiUrl.searchParams.set("page", params.page!)
            apiUrl.searchParams.set("lq", "1")
            apiUrl.searchParams.set("per_page", params.per_page!)
            break

          case "2": // Keyword search (default)
            if (params.query) {
              apiUrl.searchParams.set("query", params.query)
            }
            apiUrl.searchParams.set("page", params.page!)
            apiUrl.searchParams.set("order", "latest")
            apiUrl.searchParams.set("per_page", params.per_page!)
            break

          case "3": // Duration search
            apiUrl.searchParams.set("page", params.page!)
            apiUrl.searchParams.set("order", params.duration || "longest")
            apiUrl.searchParams.set("lq", "0")
            apiUrl.searchParams.set("per_page", params.per_page!)
            break

          case "4": // Section search
            apiUrl.searchParams.set("page", params.page!)
            apiUrl.searchParams.set("per_page", params.per_page!)
            if (params.section === "etero") {
              apiUrl.searchParams.set("order", "latest")
              apiUrl.searchParams.set("lq", "0")
              apiUrl.searchParams.set("gay", "0")
            } else if (params.section === "gay") {
              apiUrl.searchParams.set("lq", "1")
              apiUrl.searchParams.set("gay", "2")
            } else if (params.section) {
              apiUrl.searchParams.set("lq", "1")
              apiUrl.searchParams.set("query", params.section)
            }
            break

          case "5": // Home/Latest
            apiUrl.searchParams.set("page", params.page!)
            apiUrl.searchParams.set("lq", "0")
            apiUrl.searchParams.set("per_page", params.per_page!)
            break

          case "6": // Trending
            apiUrl.searchParams.set("page", params.page!)
            apiUrl.searchParams.set("order", "top-weekly")
            apiUrl.searchParams.set("lq", "0")
            apiUrl.searchParams.set("per_page", params.per_page!)
            break

          default: // Fallback to keyword search
            if (params.query) {
              apiUrl.searchParams.set("query", params.query)
            }
            apiUrl.searchParams.set("page", params.page!)
            apiUrl.searchParams.set("order", params.order!)
            apiUrl.searchParams.set("per_page", params.per_page!)
        }

        apiUrl.searchParams.set("format", "json")
        apiUrl.searchParams.set("thumbsize", params.thumbsize!)
        if (!apiUrl.searchParams.has("gay")) {
          apiUrl.searchParams.set("gay", params.gay!)
        }
        if (!apiUrl.searchParams.has("lq")) {
          apiUrl.searchParams.set("lq", params.lq!)
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000)

        response = await fetchWithRetry(apiUrl.toString(), {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "application/json, text/plain, */*",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            Referer: "https://www.eporner.com/",
            Origin: "https://www.eporner.com",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
          },
          signal: controller.signal,
          next: { revalidate: 300 },
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          console.log(`[v0] Successfully connected to eporner API via ${baseUrl}`)
          break
        }
      } catch (error) {
        console.log(`[v0] Failed to connect to ${baseUrl}:`, error)
        lastError = error as Error
        continue
      }
    }

    if (!response || !response.ok) {
      throw lastError || new Error(`All eporner endpoints failed`)
    }

    const data = await response.json()
    console.log("[v0] Eporner API response received:", data.total_count || 0, "videos")

    if (data.videos && Array.isArray(data.videos)) {
      const processedVideos = data.videos.map((video: any) => {
        const videoId = video.id
        const directVideoUrl = `https://www.eporner.com/video-${videoId}/`

        let videoFileUrl = directVideoUrl
        if (video.src && typeof video.src === "object") {
          videoFileUrl = video.src["720"] || video.src["480"] || video.src["360"] || directVideoUrl
        }

        const thumbs = []
        if (video.default_thumb?.src) {
          const baseThumb = video.default_thumb.src
          for (let i = 1; i <= 15; i++) {
            thumbs.push({
              src: baseThumb.replace(/1_/, `${i}_`),
              width: video.default_thumb.width || 640,
              height: video.default_thumb.height || 360,
            })
          }
        }

        return {
          id: video.id,
          title: video.title || "Untitled Video",
          url: directVideoUrl,
          videoUrl: videoFileUrl,
          embed: video.embed || directVideoUrl,
          thumb: video.default_thumb?.src || video.thumb || "/video-thumbnail.png",
          default_thumb: {
            src: video.default_thumb?.src || video.thumb || "/video-thumbnail.png",
            width: video.default_thumb?.width || 640,
            height: video.default_thumb?.height || 360,
          },
          thumbs: thumbs,
          length_min: video.length_min || Math.floor((video.length_sec || 0) / 60).toString(),
          length_sec: video.length_sec || 0,
          views: video.views || 0,
          rate: typeof video.rate === "number" ? video.rate : 0,
          added: video.added || new Date().toISOString(),
          keywords: video.keywords || "",
        }
      })

      return NextResponse.json({
        ...data,
        videos: processedVideos,
        searchType: params.searchType,
        currentPage: Number.parseInt(params.page!),
        hasNextPage: processedVideos.length === Number.parseInt(params.per_page!),
      })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Eporner API error:", error)

    const fallbackVideos = [
      {
        id: "sample1",
        title: "Big Buck Bunny - Sample Video",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        thumb: "/video-thumbnail.png",
        default_thumb: {
          src: "/video-thumbnail.png",
          width: 640,
          height: 360,
        },
        length_min: "9",
        views: 125000,
        rate: 4.2,
        added: new Date().toISOString(),
        keywords: "sample video",
      },
      {
        id: "sample2",
        title: "Elephants Dream - Sample Video",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        thumb: "/video-thumbnail.png",
        default_thumb: {
          src: "/video-thumbnail.png",
          width: 640,
          height: 360,
        },
        length_min: "10",
        views: 89000,
        rate: 3.8,
        added: new Date().toISOString(),
        keywords: "sample video",
      },
      {
        id: "sample3",
        title: "For Bigger Blazes - Sample Video",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        thumb: "/video-thumbnail.png",
        default_thumb: {
          src: "/video-thumbnail.png",
          width: 640,
          height: 360,
        },
        length_min: "0",
        views: 67000,
        rate: 4.5,
        added: new Date().toISOString(),
        keywords: "sample video",
      },
    ]

    console.log("[v0] API error: Using fallback data")
    return NextResponse.json({
      total_count: fallbackVideos.length,
      count: fallbackVideos.length,
      videos: fallbackVideos,
      error: "Using fallback data due to API unavailability",
    })
  }
}
