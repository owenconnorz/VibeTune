import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const ageVerified = request.cookies.get("vibetuneAgeVerified")?.value === "true"

  return NextResponse.json({
    isAgeVerified: ageVerified,
    message: ageVerified ? "Age verification confirmed" : "Age verification required",
  })
}

export async function POST(request: NextRequest) {
  try {
    const { birthDate } = await request.json()

    let age = new Date(birthDate).getFullYear() - new Date().getFullYear()
    const monthDiff = new Date().getMonth() - new Date(birthDate).getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && new Date().getDate() < new Date(birthDate).getDate())) {
      age--
    }

    const isVerified = age >= 18

    const response = NextResponse.json({
      verified: isVerified,
      message: isVerified ? "Age verification successful" : "Must be 18 or older",
    })

    if (isVerified) {
      response.cookies.set("vibetuneAgeVerified", "true", {
        maxAge: 365 * 24 * 60 * 60, // 1 year
        httpOnly: false, // Allow client-side access
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      })
    }

    return response
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
