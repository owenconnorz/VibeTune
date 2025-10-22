import { NextResponse } from "next/server"
import { getTMDBTrending, getTMDBGenreMovies, getTMDBImageUrl, TMDB_GENRES } from "@/lib/vidsrc-api"

export async function GET() {
  try {
    console.log("[v0] ===== MOVIES FEATURED API CALLED =====")

    const [trending, action, comedy, drama, horror] = await Promise.all([
      getTMDBTrending(),
      getTMDBGenreMovies(TMDB_GENRES.ACTION),
      getTMDBGenreMovies(TMDB_GENRES.COMEDY),
      getTMDBGenreMovies(TMDB_GENRES.DRAMA),
      getTMDBGenreMovies(TMDB_GENRES.HORROR),
    ])

    console.log("[v0] Movies fetched - Trending:", trending.length, "Action:", action.length, "Comedy:", comedy.length)

    // Get hero movie from trending
    const heroMovie = trending[0]

    const featuredContent = {
      hero: heroMovie
        ? {
            id: heroMovie.id.toString(),
            title: heroMovie.title,
            description: heroMovie.overview,
            thumbnail: getTMDBImageUrl(heroMovie.backdrop_path, "original"),
            rating: heroMovie.adult ? "R" : "PG-13",
            year: new Date(heroMovie.release_date).getFullYear(),
            duration: "2h 15m",
            genres: ["Action", "Drama", "Thriller"],
          }
        : null,
      categories: [
        {
          id: "trending",
          title: "Trending Now",
          items: trending.slice(0, 10).map((movie: any) => ({
            id: movie.id.toString(),
            title: movie.title,
            thumbnail: getTMDBImageUrl(movie.poster_path, "w500"),
            rating: movie.adult ? "R" : "PG-13",
            year: new Date(movie.release_date).getFullYear(),
            duration: "1h 45m",
          })),
        },
        {
          id: "action",
          title: "Action & Adventure",
          items: action.slice(0, 10).map((movie: any) => ({
            id: movie.id.toString(),
            title: movie.title,
            thumbnail: getTMDBImageUrl(movie.poster_path, "w500"),
            rating: movie.adult ? "R" : "PG-13",
            year: new Date(movie.release_date).getFullYear(),
            duration: "1h 55m",
          })),
        },
        {
          id: "comedy",
          title: "Comedy",
          items: comedy.slice(0, 10).map((movie: any) => ({
            id: movie.id.toString(),
            title: movie.title,
            thumbnail: getTMDBImageUrl(movie.poster_path, "w500"),
            rating: movie.adult ? "R" : "PG-13",
            year: new Date(movie.release_date).getFullYear(),
            duration: "1h 30m",
          })),
        },
        {
          id: "drama",
          title: "Drama",
          items: drama.slice(0, 10).map((movie: any) => ({
            id: movie.id.toString(),
            title: movie.title,
            thumbnail: getTMDBImageUrl(movie.poster_path, "w500"),
            rating: movie.adult ? "R" : "PG-13",
            year: new Date(movie.release_date).getFullYear(),
            duration: "2h 20m",
          })),
        },
        {
          id: "horror",
          title: "Horror",
          items: horror.slice(0, 10).map((movie: any) => ({
            id: movie.id.toString(),
            title: movie.title,
            thumbnail: getTMDBImageUrl(movie.poster_path, "w500"),
            rating: movie.adult ? "R" : "PG-13",
            year: new Date(movie.release_date).getFullYear(),
            duration: "1h 40m",
          })),
        },
      ],
    }

    console.log("[v0] ===== MOVIES FEATURED API SUCCESS =====")
    console.log("[v0] Hero movie:", featuredContent.hero?.title)
    console.log("[v0] Categories:", featuredContent.categories.length)

    return NextResponse.json(featuredContent)
  } catch (error) {
    console.error("[v0] ===== MOVIES FEATURED API ERROR =====")
    console.error("[v0] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch movies",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
