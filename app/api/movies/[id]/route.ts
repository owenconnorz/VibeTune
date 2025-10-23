import { NextResponse } from "next/server"
import { getMovieDetails } from "@/lib/movie-api-template"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const movieDetails = await getMovieDetails(id)

    if (!movieDetails) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 })
    }

    return NextResponse.json(movieDetails)
  } catch (error) {
    console.error(`[v0] Error fetching movie ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to fetch movie details" }, { status: 500 })
  }
}
