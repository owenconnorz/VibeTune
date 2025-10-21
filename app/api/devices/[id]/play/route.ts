import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

interface PlayRequest {
  videoId: string
  title: string
  artist: string
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const deviceId = params.id
    const body: PlayRequest = await request.json()

    console.log("[v0] Playing on device:", deviceId, "Video:", body.videoId)

    // In a real implementation, this would:
    // 1. Identify the device type (Sonos, Chromecast, etc.)
    // 2. Use the appropriate API/protocol to send playback commands
    // 3. For Sonos: Use Sonos Control API
    // 4. For Chromecast: Use Google Cast protocol
    // 5. For DLNA/UPnP: Use UPnP AV Transport protocol

    // Simulate playback command
    await new Promise((resolve) => setTimeout(resolve, 300))

    return NextResponse.json({
      success: true,
      message: `Playing "${body.title}" on device ${deviceId}`,
      deviceId,
      videoId: body.videoId,
    })
  } catch (error) {
    console.error("[v0] Error playing on device:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to play on device",
      },
      { status: 500 },
    )
  }
}
