import { NextResponse } from "next/server"
import { getMusicHomeFeed, getNewReleases, getMusicVideos } from "@/lib/innertube"

export const dynamic = "force-dynamic"
export const revalidate = 0

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
  console.log("[v0] ===== HOME API REQUEST =====")

  try {
    console.log("[v0] Fetching YouTube Music home feed with new releases and music videos...")

    const [newReleasesResult, musicVideosResult, homeFeedResult] = await Promise.allSettled([
      getNewReleases().catch((error: any) => {
        console.error("[v0] getNewReleases error:", error?.message || "Unknown error")
        return []
      }),
      getMusicVideos().catch((error: any) => {
        console.error("[v0] getMusicVideos error:", error?.message || "Unknown error")
        return []
      }),
      getMusicHomeFeed().catch((error: any) => {
        console.error("[v0] getMusicHomeFeed error:", error?.message || "Unknown error")
        return { sections: [] }
      }),
    ])

    const newReleases = newReleasesResult.status === "fulfilled" ? newReleasesResult.value : []
    const musicVideos = musicVideosResult.status === "fulfilled" ? musicVideosResult.value : []
    const homeFeed = homeFeedResult.status === "fulfilled" ? homeFeedResult.value : { sections: [] }

    console.log("[v0] New releases:", newReleases.length, "items")
    console.log("[v0] Music videos:", musicVideos.length, "items")
    console.log("[v0] Home feed sections:", homeFeed.sections?.length || 0)

    const sections: any[] = []

    // Add New Releases section if we have items
    if (newReleases.length > 0) {
      sections.push({
        title: "New Releases",
        items: newReleases.slice(0, 20),
        type: "carousel" as const,
        continuation: null,
      })
      console.log("[v0] Added 'New Releases' section with", newReleases.length, "items")
    }

    // Add Music Videos section if we have items
    if (musicVideos.length > 0) {
      sections.push({
        title: "Music Videos for You",
        items: musicVideos.slice(0, 20),
        type: "carousel" as const,
        continuation: null,
      })
      console.log("[v0] Added 'Music Videos for You' section with", musicVideos.length, "items")
    }

    // Add home feed sections
    if (homeFeed.sections && homeFeed.sections.length > 0) {
      sections.push(...homeFeed.sections)
      console.log("[v0] Added", homeFeed.sections.length, "sections from home feed")
    }

    // If we have no sections at all, use fallback
    if (sections.length === 0) {
      console.log("[v0] No sections available, using fallback data")
      return NextResponse.json(FALLBACK_DATA, {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      })
    }

    console.log("[v0] ===== HOME API SUCCESS =====")
    console.log("[v0] Total sections:", sections.length)
    console.log("[v0] Section titles:", sections.map((s: any) => s.title).join(", "))

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
    console.error("[v0] ===== HOME API ERROR =====")
    console.error("[v0] Error:", error?.message || "Unknown error")
    console.error("[v0] Stack:", error?.stack || "No stack trace")

    return NextResponse.json(FALLBACK_DATA, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    })
  }
}
