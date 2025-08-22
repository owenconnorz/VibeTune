"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface DiscordUser {
  id: string
  username: string
  discriminator: string
  avatar: string | null
}

interface SettingsContextType {
  adultContentEnabled: boolean
  setAdultContentEnabled: (enabled: boolean) => void
  discordRpcEnabled: boolean
  setDiscordRpcEnabled: (enabled: boolean) => void
  discordUser: DiscordUser | null
  discordAccessToken: string | null
  loginToDiscord: () => void
  logoutFromDiscord: () => void
  isDiscordConnected: boolean
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [adultContentEnabled, setAdultContentEnabledState] = useState(false)
  const [discordRpcEnabled, setDiscordRpcEnabledState] = useState(false)
  const [discordUser, setDiscordUser] = useState<DiscordUser | null>(null)
  const [discordAccessToken, setDiscordAccessToken] = useState<string | null>(null)

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
  }, [])

  const setAdultContentEnabled = (enabled: boolean) => {
    setAdultContentEnabledState(enabled)
    localStorage.setItem("vibetuneAdultContent", JSON.stringify(enabled))
  }

  const setDiscordRpcEnabled = (enabled: boolean) => {
    setDiscordRpcEnabledState(enabled)
    localStorage.setItem("vibetuneDiscordRpc", JSON.stringify(enabled))
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

    setDiscordRpcEnabled(false)
  }

  const isDiscordConnected = discordUser !== null && discordAccessToken !== null

  return (
    <SettingsContext.Provider
      value={{
        adultContentEnabled,
        setAdultContentEnabled,
        discordRpcEnabled,
        setDiscordRpcEnabled,
        discordUser,
        discordAccessToken,
        loginToDiscord,
        logoutFromDiscord,
        isDiscordConnected,
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
