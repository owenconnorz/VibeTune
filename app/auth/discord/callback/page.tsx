"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function DiscordCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleDiscordCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get("code")
      const error = urlParams.get("error")

      if (error) {
        console.error("[v0] Discord OAuth error:", error)
        window.close()
        return
      }

      if (code) {
        try {
          // Exchange code for access token
          const tokenResponse = await fetch("/api/auth/discord/token", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ code }),
          })

          const tokenData = await tokenResponse.json()

          if (tokenData.access_token) {
            // Get user info
            const userResponse = await fetch("https://discord.com/api/users/@me", {
              headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
              },
            })

            const userData = await userResponse.json()

            // Store in localStorage
            localStorage.setItem("vibetuneDiscordToken", tokenData.access_token)
            localStorage.setItem("vibetuneDiscordUser", JSON.stringify(userData))

            console.log("[v0] Discord authentication successful")
          }
        } catch (error) {
          console.error("[v0] Discord authentication failed:", error)
        }
      }

      // Close the popup window
      window.close()
    }

    handleDiscordCallback()
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-xl font-semibold mb-2">Connecting to Discord...</h1>
        <p className="text-muted-foreground">Please wait while we complete the authentication.</p>
      </div>
    </div>
  )
}
