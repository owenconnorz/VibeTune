// ============================================
// MOVIE API TEMPLATE
// ============================================
// This file provides a clean template for integrating your own movie API.
// Replace the placeholder functions with your actual API calls.

// ============================================
// TYPE DEFINITIONS
// ============================================
// Define the structure of your movie data

export interface Movie {
  id: string
  title: string
  description: string
  thumbnail: string // Poster image URL
  backdrop?: string // Background image URL (optional)
  rating?: string // e.g., "R", "PG-13", "PG"
  year?: number
  duration?: string // e.g., "2h 15m"
  genres?: string[]
  adult?: boolean
}

export interface MovieDetails extends Movie {
  poster: string
  videoUrl: string // URL to the video player or stream
  cast?: string[]
  director?: string
  voteAverage?: number
  voteCount?: number
}

export interface MovieCategory {
  id: string
  title: string
  items: Movie[]
}

export interface FeaturedContent {
  hero: Movie | null
  categories: MovieCategory[]
}

// ============================================
// API FUNCTIONS - REPLACE WITH YOUR OWN API
// ============================================

/**
 * Fetch featured/trending movies for the home page
 *
 * TODO: Replace this with your API call
 * Example: const response = await fetch('https://your-api.com/featured')
 */
export async function getFeaturedMovies(): Promise<FeaturedContent> {
  // TODO: Add your API call here
  // Example:
  // const response = await fetch('https://your-api.com/featured', {
  //   headers: {
  //     'Authorization': `Bearer ${process.env.YOUR_API_KEY}`,
  //   },
  // })
  // const data = await response.json()
  // return transformToFeaturedContent(data)

  // Mock data for demonstration
  return {
    hero: {
      id: "1",
      title: "Example Movie",
      description: "This is a placeholder. Replace with your API data.",
      thumbnail: "/movie-hero-banner.jpg",
      backdrop: "/movie-hero-banner.jpg",
      rating: "PG-13",
      year: 2024,
      duration: "2h 15m",
      genres: ["Action", "Drama"],
    },
    categories: [
      {
        id: "trending",
        title: "Trending Now",
        items: Array.from({ length: 10 }, (_, i) => ({
          id: `${i + 1}`,
          title: `Movie ${i + 1}`,
          description: "Replace with your API data",
          thumbnail: "/abstract-movie-poster.png",
          rating: "PG-13",
          year: 2024,
          duration: "1h 45m",
        })),
      },
      {
        id: "action",
        title: "Action & Adventure",
        items: Array.from({ length: 10 }, (_, i) => ({
          id: `${i + 11}`,
          title: `Action Movie ${i + 1}`,
          description: "Replace with your API data",
          thumbnail: "/abstract-movie-poster.png",
          rating: "R",
          year: 2024,
          duration: "1h 55m",
        })),
      },
    ],
  }
}

/**
 * Fetch detailed information for a specific movie
 *
 * TODO: Replace this with your API call
 * @param movieId - The ID of the movie to fetch
 */
export async function getMovieDetails(movieId: string): Promise<MovieDetails> {
  // TODO: Add your API call here
  // Example:
  // const response = await fetch(`https://your-api.com/movies/${movieId}`, {
  //   headers: {
  //     'Authorization': `Bearer ${process.env.YOUR_API_KEY}`,
  //   },
  // })
  // const data = await response.json()
  // return transformToMovieDetails(data)

  // Mock data for demonstration
  return {
    id: movieId,
    title: "Example Movie",
    description: "This is a placeholder. Replace with your API data.",
    thumbnail: "/movie-hero-banner.jpg",
    poster: "/abstract-movie-poster.png",
    videoUrl: "", // Add your video URL or embed code here
    rating: "PG-13",
    year: 2024,
    duration: "2h 15m",
    genres: ["Action", "Drama", "Thriller"],
    cast: ["Actor 1", "Actor 2", "Actor 3"],
    director: "Director Name",
    voteAverage: 7.5,
    voteCount: 1000,
  }
}

/**
 * Search for movies by query
 *
 * TODO: Replace this with your API call
 * @param query - The search query string
 */
export async function searchMovies(query: string): Promise<Movie[]> {
  // TODO: Add your API call here
  // Example:
  // const response = await fetch(`https://your-api.com/search?q=${encodeURIComponent(query)}`, {
  //   headers: {
  //     'Authorization': `Bearer ${process.env.YOUR_API_KEY}`,
  //   },
  // })
  // const data = await response.json()
  // return data.results.map(transformToMovie)

  if (!query) return []

  // Mock data for demonstration
  return Array.from({ length: 5 }, (_, i) => ({
    id: `search-${i + 1}`,
    title: `${query} - Result ${i + 1}`,
    description: "Replace with your API search results",
    thumbnail: "/abstract-movie-poster.png",
    rating: "PG-13",
    year: 2024,
    duration: "1h 45m",
  }))
}

/**
 * Get the video player URL or embed code
 *
 * TODO: Replace this with your video player logic
 * @param movieId - The ID of the movie
 * @returns The URL to embed or play the video
 */
export function getVideoPlayerUrl(movieId: string): string {
  // TODO: Add your video player URL logic here
  // Examples:
  // - Direct video URL: return `https://your-cdn.com/videos/${movieId}.mp4`
  // - Embed URL: return `https://your-player.com/embed/${movieId}`
  // - Custom player: return `/player/${movieId}`

  return `https://example.com/player/${movieId}` // Replace with your player URL
}

// ============================================
// HELPER FUNCTIONS (OPTIONAL)
// ============================================

/**
 * Transform your API response to match the Movie interface
 * Customize this based on your API's response structure
 */
function transformToMovie(apiData: any): Movie {
  return {
    id: apiData.id?.toString() || "",
    title: apiData.title || apiData.name || "Untitled",
    description: apiData.description || apiData.overview || "",
    thumbnail: apiData.thumbnail || apiData.poster || "/abstract-movie-poster.png",
    backdrop: apiData.backdrop || apiData.background,
    rating: apiData.rating || "NR",
    year: apiData.year || new Date().getFullYear(),
    duration: apiData.duration || "Unknown",
    genres: apiData.genres || [],
    adult: apiData.adult || false,
  }
}
