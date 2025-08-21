import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

export const runtime = "edge"

const PlaylistSchema = z.object({
  title: z.string().describe("Creative playlist title"),
  description: z.string().describe("Playlist description"),
  searchQueries: z.array(z.string()).describe("Search queries to find songs for this playlist"),
  mood: z.string().describe("Overall mood of the playlist"),
  estimatedDuration: z.string().describe("Estimated playlist duration"),
})

export async function POST(request: NextRequest) {
  try {
    const { prompt, listeningHistory, preferences } = await request.json()

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Playlist prompt is required" }, { status: 400 })
    }

    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: PlaylistSchema,
      prompt: `Create a personalized music playlist based on this request: "${prompt}"

${
  listeningHistory
    ? `User's Recent Listening History:
${listeningHistory
  .slice(0, 10)
  .map((track: any) => `- "${track.title}" by ${track.artist}`)
  .join("\n")}`
    : ""
}

${preferences ? `User Preferences: ${preferences}` : ""}

Generate:
1. A creative, engaging playlist title
2. A compelling description that explains the playlist's vibe
3. 15-20 search queries that will find songs perfect for this playlist
4. Consider the user's listening history to personalize recommendations
5. Mix popular hits with potential discoveries

The search queries should be specific enough to find actual songs on YouTube Music. Include artist names, song titles, and relevant keywords like "official", "music", "audio" when appropriate.

Focus on creating a cohesive listening experience that matches the requested mood, activity, or theme.`,
    })

    return NextResponse.json(object, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    })
  } catch (error) {
    console.error("[v0] Playlist generator error:", error)
    return NextResponse.json({ error: "Failed to generate playlist" }, { status: 500 })
  }
}
