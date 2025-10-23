import { NextResponse } from "next/server"
import { searchMovies } from "@/lib/movie-api-template"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""

    if (!query) {
      return NextResponse.json({ query: "", results: [] })
    }

    const results = await searchMovies(query)

    const searchResults = {
      query,
      results,
    }

    return NextResponse.json(searchResults)
  } catch (error) {
    console.error("[v0] Error searching movies:", error)
    return NextResponse.json({ error: "Failed to search movies" }, { status: 500 })
  }
}
