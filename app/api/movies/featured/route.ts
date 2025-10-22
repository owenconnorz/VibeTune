import { NextResponse } from "next/server"
import { getTMDBTrending, getTMDBGenreMovies, getTMDBImageUrl, TMDB_GENRES } from "@/lib/vidsrc-api"

export async function GET() {
  try {
    const [trending, action, comedy, drama, horror] = await Promise.all([
      getTMDBTrending(),
      getTMDBGenreMovies(TMDB_GENRES.ACTION),
      getTMDBGenreMovies(TMDB_GENRES.COMEDY),
      getTMDBGenreMovies(TMDB_GENRES.DRAMA),
      getTMDBGenreMovies(TMDB_GENRES.HORROR),
    ])

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
            duration: "2h 15m", // TMDB doesn't provide runtime in trending endpoint
            genres: [], // Would need additional API call for genres
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

    return NextResponse.json(featuredContent)
  } catch (error) {
    console.error("[v0] Error fetching featured movies:", error)
    return NextResponse.json({
      hero: null,
      categories: [],
    })
  }
}
