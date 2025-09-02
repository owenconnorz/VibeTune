import { type NextRequest, NextResponse } from "next/server"
import { createPipedAPI } from "@/lib/piped-api"

export async function GET(request: NextRequest, { params }: { params: { videoId: string } }) {
  try {
    console.log("[v0] Fetching Piped stream for video ID:", params.videoId)

    const pipedAPI = createPipedAPI()
    const streamData = await pipedAPI.getStreams(params.videoId)

    console.log("[v0] Successfully fetched Piped stream data")

    return NextResponse.json(streamData)
  } catch (error) {
    console.error("[v0] Error fetching Piped stream:", error)

    return NextResponse.json(
      {
        error: "Failed to fetch stream data",
        message: error instanceof Error ? error.message : "Unknown error",
        audioStreams: [],
      },
      { status: 500 },
    )
  }
}
