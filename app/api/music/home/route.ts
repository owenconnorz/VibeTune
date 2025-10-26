import { NextResponse } from "next/server"
import { getMusicHomeFeed, getNewReleases, getMusicVideos } from "@/lib/innertube"

export const dynamic = "force-dynamic"
export const revalidate = 300

const FALLBACK_DATA = {
  sections: [
    {
      title: "Trending Music",
      items: [],
      type: "carousel" as const,
      continuation: null,
    },
    {
      title: "Popular Tracks",
      items: [],
      type: "carousel" as const,
      continuation: null,
    },
  ],
}

export async function GET() {
  try {
    console.log("[v0] Home API: Starting YouTube Music home feed request")

    const [homeFeed, newReleases, musicVideos] = await Promise.all([
      getMusicHomeFeed().catch((error) => {
        console.error("[v0] Home feed error:", error)
        return { sections: [] }
      }),
      getNewReleases().catch((error) => {
        console.error("[v0] New releases error:", error)
        return []
      }),
      getMusicVideos().catch((error) => {
        console.error("[v0] Music videos error:", error)
        return []
      }),
    ])

    const sections = [...(homeFeed.sections || [])]

    if (newReleases.length > 0) {
      sections.push({
        title: "New Releases",
        items: newReleases.slice(0, 20),
        type: "carousel" as const,
        continuation: null,
      })
      console.log("[v0] Home API: Added New Releases section with", newReleases.length, "items")
    }

    if (musicVideos.length > 0) {
      sections.push({
        title: "Music Videos for You",
        items: musicVideos.slice(0, 20),
        type: "carousel" as const,
        continuation: null,
      })
      console.log("[v0] Home API: Added Music Videos section with", musicVideos.length, "items")
    }

    if (sections.length === 0) {
      console.log("[v0] Home API: No sections returned, using fallback")
      return NextResponse.json(FALLBACK_DATA, {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      })
    }

    console.log("[v0] Home API: Successfully fetched", sections.length, "sections")
    console.log("[v0] Home API: Section titles:", sections.map((s) => s.title).join(", "))

    return NextResponse.json(
      { sections },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    )
  } catch (error: any) {
    console.error("[v0] Home API error:", error?.message || "Unknown error")
    console.error("[v0] Home API stack:", error?.stack || "No stack trace")

    return NextResponse.json(FALLBACK_DATA, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    })
  }
}
