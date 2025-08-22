import { NextResponse } from "next/server"

export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Content-Length": "0",
    },
  })
}

export async function GET() {
  return NextResponse.json({
    timestamp: Date.now(),
    message: "Network test endpoint",
  })
}
