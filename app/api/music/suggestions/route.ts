import { type NextRequest, NextResponse } from "next/server"
import { searchMusic } from "@/lib/innertube"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get("q")

  if (!query || query.length < 2) {
    return NextResponse.json({ suggestions: [] })
  }

  try {
    console.log(`[v0] ===== SUGGESTIONS API =====`)
    console.log(`[v0] Query: "${query}"`)

    const searchResult = await searchMusic(query)

    console.log(`[v0] Search returned ${searchResult.videos.length} results`)

    // Extract artist and top songs from results
    const suggestions: any[] = []

    // Find artist result (should be first if present)
    const artistResult = searchResult.videos.find((v: any) => v.type === "artist")
    if (artistResult) {
      suggestions.push({
        type: "artist",
        id: artistResult.browseId || artistResult.id,
        title: artistResult.title,
        subtitle: artistResult.subscribers || "Artist",
        thumbnail: artistResult.thumbnail,
      })
      console.log(`[v0] ✓ Artist suggestion: ${artistResult.title}`)
    }

    // Add top 5 song results
    const songResults = searchResult.videos.filter((v: any) => v.type !== "artist").slice(0, 5)

    for (const song of songResults) {
      suggestions.push({
        type: "song",
        id: song.id,
        title: song.title,
        subtitle: song.artist,
        thumbnail: song.thumbnail,
        duration: song.duration,
      })
    }

    console.log(
      `[v0] Total suggestions: ${suggestions.length} (${artistResult ? "1 artist + " : ""}${songResults.length} songs)`,
    )

    return NextResponse.json(
      { suggestions },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    )
  } catch (error) {
    console.error("[v0] Suggestions error:", error)
    return NextResponse.json({ suggestions: [] })
  }
}
