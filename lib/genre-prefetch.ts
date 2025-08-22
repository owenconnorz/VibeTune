import { searchMusic } from "@/lib/music-data"
import { genreCache } from "@/lib/genre-cache"

const genreQueries: Record<string, string[]> = {
  "hip-hop-classics": [
    "Notorious BIG greatest hits",
    "Tupac classic songs",
    "Nas hip hop classics",
    "90s hip hop legends",
  ],
  "r-b-party-starters": ["Destiny's Child hits", "Beyonce party songs", "Usher dance tracks", "R&B party classics"],
  "classic-pop-party": ["Queen greatest hits", "ABBA party songs", "Blondie classic hits", "80s pop party music"],
  "feel-good-pop-rock": ["Ed Sheeran hits", "Taylor Swift songs", "Maroon 5 classics", "feel good pop rock"],
  "happy-pop-hits": ["Ed Sheeran hits", "Bruno Mars songs", "Dua Lipa hits", "happy pop music"],
  "feel-good-r-b-vibes": ["Bruno Mars hits", "The Weeknd songs", "SZA music", "feel good R&B"],
  "80s-sing-alongs": ["Madonna hits", "Kiss songs", "Bon Jovi classics", "80s sing along"],
  "relaxing-80s-rock": ["UB40 songs", "Huey Lewis hits", "Phil Collins music", "relaxing 80s rock"],
  "90s-dance": ["Chemical Brothers hits", "Fatboy Slim songs", "90s dance music"],
  "k-ing": ["IVE songs", "LE SSERAFIM hits", "NewJeans music", "K-pop 2024"],
  "pop-royalty": ["Jonas Brothers hits", "Taylor Swift songs", "pop royalty music"],
  "house-music": ["Chris Lake songs", "Calvin Harris hits", "house music 2024"],
}

export async function prefetchGenreData(genreSlug: string, pages = 2): Promise<void> {
  // Check if already cached
  if (genreCache.has(genreSlug)) {
    console.log("[v0] Genre data already cached:", genreSlug)
    return
  }

  console.log("[v0] Prefetching genre data:", genreSlug)

  try {
    const queries = genreQueries[genreSlug] || [`${genreSlug.replace(/-/g, " ")} music`]
    const allSongs: any[] = []

    // Prefetch multiple pages
    for (let page = 1; page <= pages; page++) {
      const queryIndex = (page - 1) % queries.length
      const query = queries[queryIndex]

      const results = await searchMusic(query)
      allSongs.push(...results)

      // Small delay between requests to avoid overwhelming the API
      if (page < pages) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    // Cache the results
    genreCache.set(genreSlug, allSongs, pages)
    console.log("[v0] Prefetched", allSongs.length, "songs for", genreSlug)
  } catch (error) {
    console.error("[v0] Failed to prefetch genre data:", genreSlug, error)
  }
}

// Prefetch popular genres in the background
export function prefetchPopularGenres() {
  const popularGenres = [
    "hip-hop-classics",
    "r-b-party-starters",
    "classic-pop-party",
    "feel-good-pop-rock",
    "happy-pop-hits",
  ]

  // Stagger the prefetching to avoid overwhelming the API
  popularGenres.forEach((genre, index) => {
    setTimeout(() => {
      prefetchGenreData(genre, 1) // Just prefetch first page for background loading
    }, index * 2000) // 2 second delay between each
  })
}
