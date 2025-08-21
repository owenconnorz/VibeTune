import { type NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get("url")
    const width = searchParams.get("w")
    const height = searchParams.get("h")
    const quality = searchParams.get("q") || "85"

    if (!imageUrl) {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 })
    }

    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "VibeTune/1.0",
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch image" }, { status: 404 })
    }

    const imageBuffer = await response.arrayBuffer()
    const contentType = response.headers.get("content-type") || "image/jpeg"

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, s-maxage=31536000, stale-while-revalidate=86400",
        "CDN-Cache-Control": "public, s-maxage=31536000",
        "Vercel-CDN-Cache-Control": "public, s-maxage=31536000",
      },
    })
  } catch (error) {
    console.error("[v0] Image optimization error:", error)
    return NextResponse.json({ error: "Failed to optimize image" }, { status: 500 })
  }
}
