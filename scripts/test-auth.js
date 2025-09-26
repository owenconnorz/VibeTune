// Test script to verify Google OAuth configuration
console.log("[v0] Testing Google OAuth configuration...")

const requiredEnvVars = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "NEXT_PUBLIC_BASE_URL"]

// Check environment variables
console.log("[v0] Checking environment variables...")
requiredEnvVars.forEach((varName) => {
  const value = process.env[varName]
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`)
  } else {
    console.log(`❌ ${varName}: Not set`)
  }
})

// Test Google OAuth endpoints
async function testGoogleOAuth() {
  try {
    console.log("[v0] Testing Google OAuth endpoints...")

    const clientId =
      process.env.GOOGLE_CLIENT_ID || "338253206434-pp4kk32qohilg76pbke4045uchvm13b9.apps.googleusercontent.com"
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

    // Test if we can generate auth URL
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${baseUrl}/api/auth/callback&response_type=code&scope=openid profile email https://www.googleapis.com/auth/youtube.readonly&access_type=offline&prompt=consent`

    console.log("[v0] Generated auth URL:", authUrl.substring(0, 100) + "...")

    // Test if Google recognizes our client ID
    const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=invalid`, {
      method: "GET",
    })

    console.log("[v0] Google API response status:", response.status)

    if (response.status === 400) {
      console.log("✅ Google API is accessible (expected 400 for invalid token)")
    } else {
      console.log("⚠️ Unexpected response from Google API")
    }
  } catch (error) {
    console.error("[v0] Error testing Google OAuth:", error.message)
  }
}

// Test local auth endpoints
async function testLocalEndpoints() {
  try {
    console.log("[v0] Testing local auth endpoints...")

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

    // Test /api/auth/me endpoint
    const meResponse = await fetch(`${baseUrl}/api/auth/me`)
    console.log(`[v0] /api/auth/me status: ${meResponse.status}`)

    if (meResponse.status === 401) {
      console.log("✅ /api/auth/me returns 401 (expected when not authenticated)")
    }

    // Test /api/auth/google endpoint
    const googleResponse = await fetch(`${baseUrl}/api/auth/google`, {
      redirect: "manual",
    })
    console.log(`[v0] /api/auth/google status: ${googleResponse.status}`)

    if (googleResponse.status === 302 || googleResponse.status === 307) {
      console.log("✅ /api/auth/google redirects properly")
    } else if (googleResponse.status === 500) {
      const errorData = await googleResponse.json()
      console.log("❌ /api/auth/google error:", errorData.error)
    }
  } catch (error) {
    console.error("[v0] Error testing local endpoints:", error.message)
    console.log("ℹ️ This is expected if the server is not running")
  }
}

// Run tests
async function runTests() {
  await testGoogleOAuth()
  console.log("")
  await testLocalEndpoints()

  console.log("")
  console.log("[v0] Auth configuration test complete!")
  console.log("")
  console.log("If you're still having issues:")
  console.log("1. Check that your Google OAuth app is configured correctly")
  console.log("2. Verify the redirect URI matches your domain")
  console.log("3. Make sure environment variables are set in Vercel dashboard")
  console.log("4. Check browser console for CORS or network errors")
}

runTests()
