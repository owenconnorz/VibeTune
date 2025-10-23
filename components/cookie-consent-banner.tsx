"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { hasUserRespondedToConsent, setUserConsent, areCookiesEnabled } from "@/lib/cookies"

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [cookiesEnabled, setCookiesEnabled] = useState(true)

  useEffect(() => {
    // Check if user has already responded to consent
    const hasResponded = hasUserRespondedToConsent()
    const enabled = areCookiesEnabled()

    setCookiesEnabled(enabled)
    setShowBanner(!hasResponded && enabled)
  }, [])

  const handleAccept = () => {
    setUserConsent(true)
    setShowBanner(false)
  }

  const handleDecline = () => {
    setUserConsent(false)
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-sm border-t border-border shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">Cookie Consent</h3>
          <p className="text-sm text-muted-foreground">
            We use cookies to enhance your experience. Cookies help us remember your preferences and provide
            personalized features. By clicking "Accept", you agree to our use of cookies.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={handleDecline} className="flex-1 sm:flex-none bg-transparent">
            Decline
          </Button>
          <Button onClick={handleAccept} className="flex-1 sm:flex-none">
            Accept
          </Button>
        </div>
      </div>
    </div>
  )
}
