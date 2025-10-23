import { type NextRequest, NextResponse } from "next/server"
import { searchMusic } from "@/lib/innertube"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Define category configurations with subcategories
const categoryConfig: Record<
  string,
  {
    name: string
    subcategories: Array<{
      title: string
      query: string
    }>
  }
> = {
  // Moods
  energize: {
    name: "Energize",
    subcategories: [
      { title: "Pop bangers", query: "energetic pop workout music" },
      { title: "Dance club beats", query: "dance club edm music" },
      { title: "Hip-hop energy", query: "hip hop workout energy music" },
    ],
  },
  blues: {
    name: "Blues",
    subcategories: [
      { title: "Featured playlists", query: "blues music classics" },
      { title: "Community playlists", query: "blues guitar instrumental" },
    ],
  },
  "indie-alternative": {
    name: "Indie & alternative",
    subcategories: [
      { title: "Indie rock", query: "indie rock alternative music" },
      { title: "Alternative hits", query: "alternative rock music" },
    ],
  },
  commute: {
    name: "Commute",
    subcategories: [
      { title: "Morning drive", query: "morning commute music" },
      { title: "Evening chill", query: "evening relaxing music" },
    ],
  },
  "uk-rap": {
    name: "UK rap",
    subcategories: [
      { title: "UK drill", query: "uk drill rap music" },
      { title: "Grime", query: "grime uk rap music" },
    ],
  },
  "cosy-season": {
    name: "Cosy Season",
    subcategories: [
      { title: "Autumn vibes", query: "autumn cozy music" },
      { title: "Winter warmth", query: "winter cozy music" },
    ],
  },
  "feel-good": {
    name: "Feel good",
    subcategories: [
      { title: "Happy hits", query: "happy feel good music" },
      { title: "Uplifting songs", query: "uplifting positive music" },
    ],
  },
  "1990s": {
    name: "1990s",
    subcategories: [
      { title: "90s hits", query: "1990s music hits" },
      { title: "90s rock", query: "1990s rock music" },
    ],
  },
  // Additional categories
  "folk-acoustic": {
    name: "Folk & acoustic",
    subcategories: [
      { title: "Acoustic covers", query: "acoustic folk music" },
      { title: "Singer-songwriter", query: "singer songwriter folk" },
    ],
  },
  sleep: {
    name: "Sleep",
    subcategories: [
      { title: "Sleep sounds", query: "sleep meditation music" },
      { title: "Ambient sleep", query: "ambient sleep music" },
    ],
  },
  iraqi: {
    name: "Iraqi",
    subcategories: [
      { title: "Iraqi classics", query: "iraqi music classics" },
      { title: "Modern Iraqi", query: "modern iraqi music" },
    ],
  },
  party: {
    name: "Party",
    subcategories: [
      { title: "Party anthems", query: "party dance music" },
      { title: "Club hits", query: "club party music" },
    ],
  },
  pop: {
    name: "Pop",
    subcategories: [
      { title: "Pop hits", query: "pop music hits" },
      { title: "Pop classics", query: "classic pop music" },
    ],
  },
  metal: {
    name: "Metal",
    subcategories: [
      { title: "Heavy metal", query: "heavy metal music" },
      { title: "Metal classics", query: "classic metal music" },
    ],
  },
  rock: {
    name: "Rock",
    subcategories: [
      { title: "Rock classics", query: "classic rock music" },
      { title: "Modern rock", query: "modern rock music" },
    ],
  },
  classical: {
    name: "Classical",
    subcategories: [
      { title: "Classical masterpieces", query: "classical music masterpieces" },
      { title: "Piano classics", query: "classical piano music" },
    ],
  },
  "1980s": {
    name: "1980s",
    subcategories: [
      { title: "80s hits", query: "1980s music hits" },
      { title: "80s pop", query: "1980s pop music" },
    ],
  },
  romance: {
    name: "Romance",
    subcategories: [
      { title: "Love songs", query: "romantic love songs" },
      { title: "Slow dance", query: "slow dance romantic music" },
    ],
  },
  "1960s": {
    name: "1960s",
    subcategories: [
      { title: "60s classics", query: "1960s music classics" },
      { title: "60s rock", query: "1960s rock music" },
    ],
  },
  "1950s": {
    name: "1950s",
    subcategories: [
      { title: "50s classics", query: "1950s music classics" },
      { title: "Rock n roll", query: "1950s rock and roll" },
    ],
  },
  "desi-hiphop": {
    name: "Desi hip-hop",
    subcategories: [
      { title: "Desi rap", query: "desi hip hop rap music" },
      { title: "Bollywood hip-hop", query: "bollywood hip hop music" },
    ],
  },
  "2010s": {
    name: "2010s",
    subcategories: [
      { title: "2010s hits", query: "2010s music hits" },
      { title: "2010s pop", query: "2010s pop music" },
    ],
  },
  "2000s": {
    name: "2000s",
    subcategories: [
      { title: "2000s hits", query: "2000s music hits" },
      { title: "2000s pop", query: "2000s pop music" },
    ],
  },
  kpop: {
    name: "K-Pop",
    subcategories: [
      { title: "K-Pop hits", query: "kpop music hits" },
      { title: "K-Pop groups", query: "kpop groups music" },
    ],
  },
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const category = categoryConfig[id]

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 })
  }

  try {
    console.log(`[v0] Fetching category: ${category.name}`)

    // Fetch playlists for each subcategory
    const subcategoriesWithPlaylists = await Promise.all(
      category.subcategories.map(async (subcategory) => {
        try {
          const result = await searchMusic(subcategory.query, undefined)
          return {
            title: subcategory.title,
            playlists: result.videos.slice(0, 10), // Limit to 10 playlists per subcategory
          }
        } catch (error) {
          console.error(`[v0] Error fetching subcategory ${subcategory.title}:`, error)
          return {
            title: subcategory.title,
            playlists: [],
          }
        }
      }),
    )

    return NextResponse.json(
      {
        name: category.name,
        subcategories: subcategoriesWithPlaylists,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
        },
      },
    )
  } catch (error: any) {
    console.error("[v0] Category fetch error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch category",
        message: error.message,
        name: category.name,
        subcategories: [],
      },
      { status: 200 },
    )
  }
}
