"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface SettingsContextType {
  adultContentEnabled: boolean
  setAdultContentEnabled: (enabled: boolean) => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [adultContentEnabled, setAdultContentEnabledState] = useState(false)

  useEffect(() => {
    // Load setting from localStorage on mount
    const saved = localStorage.getItem("vibetuneAdultContent")
    if (saved) {
      setAdultContentEnabledState(JSON.parse(saved))
    }
  }, [])

  const setAdultContentEnabled = (enabled: boolean) => {
    setAdultContentEnabledState(enabled)
    localStorage.setItem("vibetuneAdultContent", JSON.stringify(enabled))
  }

  return (
    <SettingsContext.Provider value={{ adultContentEnabled, setAdultContentEnabled }}>
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
