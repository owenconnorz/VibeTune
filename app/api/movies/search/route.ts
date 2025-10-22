import { NextResponse } from "next/server"
import { searchTMDB, getTMDBImageUrl } from "@/lib/vidsrc-api"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""

    if (!query) {
      return NextResponse.json({ query: "", results: [] })
    }

    const results = await searchTMDB(query)

    const searchResults = {
      query,
      results: results.map((movie: any) => ({
        id: movie.id.toString(),
        title: movie.title,
        thumbnail: getTMDBImageUrl(movie.poster_path, "w500"),
        rating: movie.adult ? "R" : "PG-13",
        year: movie.release_date ? new Date(movie.release_date).getFullYear() : 2024,
        duration: "1h 45m",
        description: movie.overview,
      })),
    }

    return NextResponse.json(searchResults)
  } catch (error) {
    console.error("[v0] Error searching movies:", error)
    return NextResponse.json({ error: "Failed to search movies" }, { status: 500 })
  }
}
