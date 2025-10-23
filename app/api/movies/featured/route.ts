import { NextResponse } from "next/server"
import { getFeaturedMovies } from "@/lib/movie-api-template"

export async function GET() {
  try {
    console.log("[v0] ===== MOVIES FEATURED API CALLED =====")

    const featuredContent = await getFeaturedMovies()

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
