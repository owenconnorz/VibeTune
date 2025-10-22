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
    console.log("[v0] Fetching TMDB trending movies...")
    console.log("[v0] TMDB_API_KEY exists:", !!TMDB_API_KEY)

    if (!TMDB_API_KEY) {
      console.log("[v0] No TMDB_API_KEY found, returning mock data")
      return getMockMovies()
    }

    const response = await fetch(
      `${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}`,
      { next: { revalidate: 3600 } }, // Cache for 1 hour
    )

    if (!response.ok) {
      console.log("[v0] TMDB API error:", response.status, response.statusText)
      throw new Error("Failed to fetch trending movies")
    }

    const data = await response.json()
    console.log("[v0] TMDB trending movies fetched:", data.results.length)
    return data.results
  } catch (error) {
    console.error("[v0] Error fetching TMDB trending:", error)
    return getMockMovies()
  }
}

export async function getTMDBMovieDetails(movieId: string) {
  try {
    console.log("[v0] Fetching TMDB movie details for:", movieId)

    if (!TMDB_API_KEY) {
      console.log("[v0] No TMDB_API_KEY found, returning mock movie details")
      return getMockMovieDetails(movieId)
    }

    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&append_to_response=credits,videos`,
      { next: { revalidate: 86400 } }, // Cache for 24 hours
    )

    if (!response.ok) {
      console.log("[v0] TMDB movie details error:", response.status)
      throw new Error("Failed to fetch movie details")
    }

    const data = await response.json()
    console.log("[v0] Movie details fetched for:", data.title)
    return data
  } catch (error) {
    console.error("[v0] Error fetching TMDB movie details:", error)
    return getMockMovieDetails(movieId)
  }
}

export async function searchTMDB(query: string) {
  try {
    console.log("[v0] Searching TMDB for:", query)

    if (!TMDB_API_KEY) {
      console.log("[v0] No TMDB_API_KEY found, returning mock search results")
      return getMockMovies().filter((m) => m.title.toLowerCase().includes(query.toLowerCase()))
    }

    const response = await fetch(
      `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`,
      { next: { revalidate: 3600 } },
    )

    if (!response.ok) {
      console.log("[v0] TMDB search error:", response.status)
      throw new Error("Failed to search movies")
    }

    const data = await response.json()
    console.log("[v0] Search results found:", data.results.length)
    return data.results
  } catch (error) {
    console.error("[v0] Error searching TMDB:", error)
    return []
  }
}

export async function getTMDBGenreMovies(genreId: number) {
  try {
    console.log("[v0] Fetching TMDB genre movies for genre:", genreId)

    if (!TMDB_API_KEY) {
      console.log("[v0] No TMDB_API_KEY found, returning mock genre movies")
      return getMockMovies()
    }

    const response = await fetch(
      `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&sort_by=popularity.desc`,
      { next: { revalidate: 3600 } },
    )

    if (!response.ok) {
      console.log("[v0] TMDB genre movies error:", response.status)
      throw new Error("Failed to fetch genre movies")
    }

    const data = await response.json()
    console.log("[v0] Genre movies fetched:", data.results.length)
    return data.results
  } catch (error) {
    console.error("[v0] Error fetching genre movies:", error)
    return getMockMovies()
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

// Mock data functions for when TMDB API is not available
function getMockMovies() {
  return [
    {
      id: 550,
      title: "Fight Club",
      overview:
        "A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.",
      poster_path: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
      backdrop_path: "/fCayJrkfRaCRCTh8GqN30f8oyQF.jpg",
      release_date: "1999-10-15",
      adult: false,
    },
    {
      id: 13,
      title: "Forrest Gump",
      overview:
        "A man with a low IQ has accomplished great things in his life and been present during significant historic events.",
      poster_path: "/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg",
      backdrop_path: "/3h1JZGDhZ8nzxdgvkxha0qBqi05.jpg",
      release_date: "1994-07-06",
      adult: false,
    },
    {
      id: 278,
      title: "The Shawshank Redemption",
      overview:
        "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
      poster_path: "/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
      backdrop_path: "/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg",
      release_date: "1994-09-23",
      adult: false,
    },
    {
      id: 238,
      title: "The Godfather",
      overview:
        "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.",
      poster_path: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
      backdrop_path: "/tmU7GeKVybMWFButWEGl2M4GeiP.jpg",
      release_date: "1972-03-14",
      adult: false,
    },
    {
      id: 424,
      title: "Schindler's List",
      overview:
        "In German-occupied Poland during World War II, industrialist Oskar Schindler gradually becomes concerned for his Jewish workforce.",
      poster_path: "/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg",
      backdrop_path: "/loRmRzQXZeqG78TqZuyvSlEQfZb.jpg",
      release_date: "1993-12-15",
      adult: false,
    },
    {
      id: 680,
      title: "Pulp Fiction",
      overview:
        "The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption.",
      poster_path: "/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
      backdrop_path: "/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg",
      release_date: "1994-09-10",
      adult: false,
    },
    {
      id: 155,
      title: "The Dark Knight",
      overview:
        "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest tests.",
      poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
      backdrop_path: "/hkBaDkMWbLaf8B1lsWsKX7Ew3Xq.jpg",
      release_date: "2008-07-18",
      adult: false,
    },
    {
      id: 497,
      title: "The Green Mile",
      overview:
        "The lives of guards on Death Row are affected by one of their charges: a black man accused of child murder and rape.",
      poster_path: "/velWPhVMQeQKcxggNEU8YmIo52R.jpg",
      backdrop_path: "/l6hQWH9eDksNJNiXWYRkWqikOdu.jpg",
      release_date: "1999-12-10",
      adult: false,
    },
    {
      id: 389,
      title: "12 Angry Men",
      overview:
        "A jury holdout attempts to prevent a miscarriage of justice by forcing his colleagues to reconsider the evidence.",
      poster_path: "/ow3wq89wM8qd5X7hWKxiRfsFf9C.jpg",
      backdrop_path: "/qqHQsStV6exghCM7zbObuYBiYxw.jpg",
      release_date: "1957-04-10",
      adult: false,
    },
    {
      id: 129,
      title: "Spirited Away",
      overview:
        "During her family's move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches, and spirits.",
      poster_path: "/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
      backdrop_path: "/Ab8mkHmkYADjU7wQiOkia9BzGvS.jpg",
      release_date: "2001-07-20",
      adult: false,
    },
  ]
}

function getMockMovieDetails(movieId: string) {
  const mockMovies = getMockMovies()
  const movie = mockMovies.find((m) => m.id.toString() === movieId) || mockMovies[0]

  return {
    ...movie,
    runtime: 142,
    genres: [
      { id: 18, name: "Drama" },
      { id: 53, name: "Thriller" },
    ],
    credits: {
      cast: [
        { id: 1, name: "Actor One", character: "Character One", profile_path: null },
        { id: 2, name: "Actor Two", character: "Character Two", profile_path: null },
      ],
    },
    videos: {
      results: [],
    },
  }
}
