import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

export const runtime = "edge"

const SmartSearchSchema = z.object({
  searchQueries: z.array(z.string()).describe("Optimized search queries for music platforms"),
  intent: z.string().describe("The user's search intent (song, artist, mood, genre, etc.)"),
  filters: z
    .object({
      genre: z.string().optional(),
      mood: z.string().optional(),
      era: z.string().optional(),
      tempo: z.string().optional(),
    })
    .describe("Suggested filters based on the query"),
})

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 })
    }

    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: SmartSearchSchema,
      prompt: `Analyze this music search query and convert it into optimized search terms for a music platform: "${query}"

The user might be searching for:
- Specific songs or artists
- Music by mood (happy, sad, energetic, chill, etc.)
- Music by genre (rock, pop, hip-hop, electronic, etc.)
- Music by era or decade (80s, 90s, 2000s, etc.)
- Music by activity (workout, study, party, sleep, etc.)
- Vague descriptions that need interpretation

Generate 2-3 specific search queries that would find the best results on YouTube Music. Make them:
1. Specific enough to find relevant content
2. Include relevant keywords like "official", "music", "song" when appropriate
3. Handle typos or alternative spellings
4. Expand abbreviations or slang terms

Also identify the search intent and suggest relevant filters.`,
    })

    return NextResponse.json(object, {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
      },
    })
  } catch (error) {
    console.error("[v0] Smart search error:", error)
    return NextResponse.json({ error: "Failed to process search query" }, { status: 500 })
  }
}
