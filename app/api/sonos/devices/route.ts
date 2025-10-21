import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    // TODO: Implement actual Sonos device discovery
    // This would require:
    // 1. Sonos Control API integration with OAuth
    // 2. Local network discovery using SSDP/UPnP
    // 3. User authentication with Sonos account

    // For now, return mock Sonos devices to demonstrate the UI
    const mockSonosDevices = [
      {
        id: "sonos-living-room",
        name: "Living Room",
        type: "sonos",
        model: "Sonos One",
        available: true,
        connected: false,
        ipAddress: "192.168.1.100",
      },
      {
        id: "sonos-bedroom",
        name: "Bedroom",
        type: "sonos",
        model: "Sonos Beam",
        available: true,
        connected: false,
        ipAddress: "192.168.1.101",
      },
      {
        id: "sonos-kitchen",
        name: "Kitchen",
        type: "sonos",
        model: "Sonos Play:5",
        available: true,
        connected: false,
        ipAddress: "192.168.1.102",
      },
    ]

    return NextResponse.json({
      devices: mockSonosDevices,
      note: "Sonos integration is in development. These are demo devices.",
    })
  } catch (error) {
    console.error("[v0] Error fetching Sonos devices:", error)
    return NextResponse.json({ devices: [], error: "Failed to fetch Sonos devices" }, { status: 500 })
  }
}
