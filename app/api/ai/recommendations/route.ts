import { type NextRequest, NextResponse } from "next/server"
import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

export const runtime = "edge"

const RecommendationSchema = z.object({
  recommendations: z.array(
    z.object({
      query: z.string().describe("Search query for finding similar music"),
      reason: z.string().describe("Why this recommendation fits the user's taste"),
      mood: z.string().describe("The mood or genre category"),
    }),
  ),
  explanation: z.string().describe("Overall explanation of the recommendation strategy"),
})

export async function POST(request: NextRequest) {
  try {
    const { listeningHistory, currentMood, preferences } = await request.json()

    if (!listeningHistory || listeningHistory.length === 0) {
      return NextResponse.json({ error: "Listening history is required" }, { status: 400 })
    }

    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: RecommendationSchema,
      prompt: `Based on this user's music listening history, generate 5 personalized music recommendations.

Listening History (most recent first):
${listeningHistory.map((track: any) => `- "${track.title}" by ${track.artist} (played ${track.playCount} times)`).join("\n")}

Current Mood: ${currentMood || "Not specified"}
User Preferences: ${preferences || "Not specified"}

Generate search queries that will find similar music, new artists in the same genres, or music that matches their listening patterns. Focus on:
1. Similar artists and genres from their history
2. Songs that match the current mood if specified
3. Discovery of new music that fits their taste profile
4. Mix of popular and lesser-known tracks

Each recommendation should include a specific search query and explanation.`,
    })

    return NextResponse.json(object, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    })
  } catch (error) {
    console.error("[v0] AI recommendations error:", error)
    return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 })
  }
}
