import { type NextRequest, NextResponse } from "next/server"
import { getAudioStream } from "@/lib/innertube"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const result = await getAudioStream(id)

    if (!result) {
      return NextResponse.json({ error: "Audio stream not found" }, { status: 404 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Stream error:", error)
    return NextResponse.json({ error: "Failed to get audio stream" }, { status: 500 })
  }
}
