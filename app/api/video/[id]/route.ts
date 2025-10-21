import { type NextRequest, NextResponse } from "next/server"
import { getVideoDetails } from "@/lib/youtube-api"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params

  try {
    const video = await getVideoDetails(id)

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    return NextResponse.json(video)
  } catch (error) {
    console.error("Video details error:", error)
    return NextResponse.json({ error: "Failed to get video details" }, { status: 500 })
  }
}
