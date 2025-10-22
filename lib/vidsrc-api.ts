// VidSrc API integration
// VidSrc provides embeddable video players for movies and TV shows
// Documentation: https://vidsrc.to

export interface VidSrcMovie {
  id: string
  title: string
  year: number
  rating?: string
  poster?: string
  backdrop?: string
}

export interface VidSrcTVShow {
  id: string
  title: string
  year: number
  rating?: string
  poster?: string
  backdrop?: string
}

// VidSrc embed URL generator
export function getVidSrcEmbedUrl(type: "movie" | "tv", id: string, season?: number, episode?: number): string {
  const baseUrl = "https://vidsrc.to/embed"

  if (type === "movie") {
    return `${baseUrl}/movie/${id}`
  } else {
    // For TV shows, you need season and episode
    return `${baseUrl}/tv/${id}/${season}/${episode}`
  }
}

// TMDB API integration for metadata (free API)
// You'll need to get a free API key from https://www.themoviedb.org/settings/api
const TMDB_API_KEY = process.env.TMDB_API_KEY || ""
const TMDB_BASE_URL = "https://api.themoviedb.org/3"
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p"

export async function getTMDBTrending() {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}`,
      { next: { revalidate: 3600 } }, // Cache for 1 hour
    )

    if (!response.ok) {
      throw new Error("Failed to fetch trending movies")
    }

    const data = await response.json()
    return data.results
  } catch (error) {
    console.error("[v0] Error fetching TMDB trending:", error)
    return []
  }
}

export async function getTMDBMovieDetails(movieId: string) {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&append_to_response=credits,videos`,
      { next: { revalidate: 86400 } }, // Cache for 24 hours
    )

    if (!response.ok) {
      throw new Error("Failed to fetch movie details")
    }

    return await response.json()
  } catch (error) {
    console.error("[v0] Error fetching TMDB movie details:", error)
    return null
  }
}

export async function searchTMDB(query: string) {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`,
      { next: { revalidate: 3600 } },
    )

    if (!response.ok) {
      throw new Error("Failed to search movies")
    }

    const data = await response.json()
    return data.results
  } catch (error) {
    console.error("[v0] Error searching TMDB:", error)
    return []
  }
}

export async function getTMDBGenreMovies(genreId: number) {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&sort_by=popularity.desc`,
      { next: { revalidate: 3600 } },
    )

    if (!response.ok) {
      throw new Error("Failed to fetch genre movies")
    }

    const data = await response.json()
    return data.results
  } catch (error) {
    console.error("[v0] Error fetching genre movies:", error)
    return []
  }
}

// Helper to get full image URL
export function getTMDBImageUrl(path: string | null, size: "w300" | "w500" | "original" = "w500"): string {
  if (!path) return "/abstract-movie-poster.png"
  return `${TMDB_IMAGE_BASE}/${size}${path}`
}

// Genre IDs from TMDB
export const TMDB_GENRES = {
  ACTION: 28,
  ADVENTURE: 12,
  ANIMATION: 16,
  COMEDY: 35,
  CRIME: 80,
  DOCUMENTARY: 99,
  DRAMA: 18,
  FAMILY: 10751,
  FANTASY: 14,
  HISTORY: 36,
  HORROR: 27,
  MUSIC: 10402,
  MYSTERY: 9648,
  ROMANCE: 10749,
  SCIENCE_FICTION: 878,
  THRILLER: 53,
  WAR: 10752,
  WESTERN: 37,
}
