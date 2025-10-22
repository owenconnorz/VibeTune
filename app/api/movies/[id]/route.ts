import { NextResponse } from "next/server"
import { getTMDBMovieDetails, getTMDBImageUrl } from "@/lib/vidsrc-api"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const movie = await getTMDBMovieDetails(id)

    if (!movie) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 })
    }

    // Extract cast and crew
    const cast = movie.credits?.cast?.slice(0, 5).map((actor: any) => actor.name) || []
    const director = movie.credits?.crew?.find((person: any) => person.job === "Director")?.name || "Unknown"

    const movieDetails = {
      id: movie.id.toString(),
      title: movie.title,
      description: movie.overview,
      thumbnail: getTMDBImageUrl(movie.backdrop_path, "original"),
      poster: getTMDBImageUrl(movie.poster_path, "w500"),
      videoUrl: "", // VidSrc embed will be used in the player component
      rating: movie.adult ? "R" : movie.vote_average > 7 ? "PG-13" : "PG",
      year: new Date(movie.release_date).getFullYear(),
      duration: `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`,
      genres: movie.genres?.map((g: any) => g.name) || [],
      cast,
      director,
      voteAverage: movie.vote_average,
      voteCount: movie.vote_count,
    }

    return NextResponse.json(movieDetails)
  } catch (error) {
    console.error(`[v0] Error fetching movie ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to fetch movie details" }, { status: 500 })
  }
}
