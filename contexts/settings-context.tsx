"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { YouTubeAPISettings } from "@/lib/youtube-api-advanced"

interface DiscordUser {
  id: string
  username: string
  discriminator: string
  avatar: string | null
}

interface SettingsContextType {
  adultContentEnabled: boolean
  setAdultContentEnabled: (enabled: boolean) => void
  showAdultContent: boolean
  discordRpcEnabled: boolean
  setDiscordRpcEnabled: (enabled: boolean) => void
  discordUser: DiscordUser | null
  discordAccessToken: string | null
  loginToDiscord: () => void
  logoutFromDiscord: () => void
  isDiscordConnected: boolean
  isAgeVerified: boolean
  setAgeVerified: (verified: boolean) => void
  showAgeVerification: boolean
  setShowAgeVerification: (show: boolean) => void
  youtubeSettings: YouTubeAPISettings
  setYoutubeSettings: (settings: Partial<YouTubeAPISettings>) => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [adultContentEnabled, setAdultContentEnabledState] = useState(false)
  const [discordRpcEnabled, setDiscordRpcEnabledState] = useState(false)
  const [discordUser, setDiscordUser] = useState<DiscordUser | null>(null)
  const [discordAccessToken, setDiscordAccessToken] = useState<string | null>(null)
  const [isAgeVerified, setIsAgeVerifiedState] = useState(false)
  const [showAgeVerification, setShowAgeVerification] = useState(false)

  const [youtubeSettings, setYoutubeSettingsState] = useState<YouTubeAPISettings>({
    highQuality: false,
    preferVideos: false,
    showVideos: false,
    highQualityAudio: false,
    preferOpus: true,
    adaptiveAudio: true,
  })

  const setCookie = (name: string, value: string, days = 365) => {
    const expires = new Date()
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`
  }

  const getCookie = (name: string): string | null => {
    const nameEQ = name + "="
    const ca = document.cookie.split(";")
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i]
      while (c.charAt(0) === " ") c = c.substring(1, c.length)
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
    }
    return null
  }

  useEffect(() => {
    const saved = localStorage.getItem("vibetuneAdultContent")
    if (saved) {
      setAdultContentEnabledState(JSON.parse(saved))
    }

    const discordSaved = localStorage.getItem("vibetuneDiscordRpc")
    if (discordSaved) {
      setDiscordRpcEnabledState(JSON.parse(discordSaved))
    }

    const discordUserSaved = localStorage.getItem("vibetuneDiscordUser")
    const discordTokenSaved = localStorage.getItem("vibetuneDiscordToken")

    if (discordUserSaved && discordTokenSaved) {
      setDiscordUser(JSON.parse(discordUserSaved))
      setDiscordAccessToken(discordTokenSaved)
    }

    const ageVerified = getCookie("vibetuneAgeVerified")
    if (ageVerified === "true") {
      setIsAgeVerifiedState(true)
    }

    const youtubeSaved = localStorage.getItem("vibetuneYoutubeSettings")
    if (youtubeSaved) {
      try {
        const parsed = JSON.parse(youtubeSaved)
        setYoutubeSettingsState(parsed)
      } catch (error) {
        console.error("Failed to parse YouTube settings:", error)
      }
    }
  }, [])

  const setAdultContentEnabled = (enabled: boolean) => {
    if (enabled && !isAgeVerified) {
      setShowAgeVerification(true)
      return
    }
    setAdultContentEnabledState(enabled)
    localStorage.setItem("vibetuneAdultContent", JSON.stringify(enabled))
  }

  const setAgeVerified = (verified: boolean) => {
    setIsAgeVerifiedState(verified)
    setCookie("vibetuneAgeVerified", verified.toString(), 365) // 1 year expiration

    if (verified) {
      setShowAgeVerification(false)
      setAdultContentEnabledState(true)
      localStorage.setItem("vibetuneAdultContent", JSON.stringify(true))
    }
  }

  const loginToDiscord = () => {
    const clientId = "1234567890123456789" // Replace with your Discord app client ID
    const redirectUri = encodeURIComponent(window.location.origin + "/auth/discord/callback")
    const scope = encodeURIComponent("identify rpc")

    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`

    const popup = window.open(discordAuthUrl, "discord-auth", "width=500,height=700,scrollbars=yes,resizable=yes")

    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed)
        const token = localStorage.getItem("vibetuneDiscordToken")
        const user = localStorage.getItem("vibetuneDiscordUser")

        if (token && user) {
          setDiscordAccessToken(token)
          setDiscordUser(JSON.parse(user))
        }
      }
    }, 1000)
  }

  const logoutFromDiscord = () => {
    setDiscordUser(null)
    setDiscordAccessToken(null)
    localStorage.removeItem("vibetuneDiscordUser")
    localStorage.removeItem("vibetuneDiscordToken")

    setDiscordRpcEnabledState(false)
  }

  const setYoutubeSettings = (newSettings: Partial<YouTubeAPISettings>) => {
    const updatedSettings = { ...youtubeSettings, ...newSettings }
    setYoutubeSettingsState(updatedSettings)
    localStorage.setItem("vibetuneYoutubeSettings", JSON.stringify(updatedSettings))
    console.log("[v0] YouTube settings updated:", updatedSettings)
  }

  const isDiscordConnected = discordUser !== null && discordAccessToken !== null

  return (
    <SettingsContext.Provider
      value={{
        adultContentEnabled,
        setAdultContentEnabled,
        showAdultContent: adultContentEnabled,
        discordRpcEnabled,
        setDiscordRpcEnabled: setDiscordRpcEnabledState,
        discordUser,
        discordAccessToken,
        loginToDiscord,
        logoutFromDiscord,
        isDiscordConnected,
        isAgeVerified,
        setAgeVerified,
        showAgeVerification,
        setShowAgeVerification,
        youtubeSettings,
        setYoutubeSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
}
