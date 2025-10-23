"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Cookie, Trash2 } from "lucide-react"
import Link from "next/link"
import { getAllCookies, deleteCookie, hasUserConsented, setUserConsent, hasUserRespondedToConsent } from "@/lib/cookies"

export default function CookiesSettingsPage() {
  const [cookies, setCookies] = useState<Record<string, string>>({})
  const [cookieConsent, setCookieConsent] = useState(false)
  const [hasResponded, setHasResponded] = useState(false)

  useEffect(() => {
    loadCookies()
    setCookieConsent(hasUserConsented())
    setHasResponded(hasUserRespondedToConsent())
  }, [])

  const loadCookies = () => {
    const allCookies = getAllCookies()
    setCookies(allCookies)
  }

  const handleDeleteCookie = (name: string) => {
    deleteCookie(name)
    loadCookies()
  }

  const handleClearAllCookies = () => {
    Object.keys(cookies).forEach((name) => {
      deleteCookie(name)
    })
    loadCookies()
  }

  const handleConsentToggle = (enabled: boolean) => {
    setUserConsent(enabled)
    setCookieConsent(enabled)
    setHasResponded(true)
  }

  const cookieCount = Object.keys(cookies).length

  return (
    <div className="min-h-screen bg-background p-4 pb-32">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Cookies</h1>
            <p className="text-sm text-muted-foreground">Manage your cookie preferences</p>
          </div>
        </div>

        {/* Cookie Consent */}
        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Cookie className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Cookie Consent</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Allow OpenTune to use cookies for enhanced features and personalization. This will enable future
                features like user accounts and cross-device sync.
              </p>
            </div>
            <Switch checked={cookieConsent} onCheckedChange={handleConsentToggle} />
          </div>
        </Card>

        {/* Current Cookies */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Current Cookies</h2>
              <p className="text-sm text-muted-foreground">
                {cookieCount} cookie{cookieCount !== 1 ? "s" : ""} stored
              </p>
            </div>
            {cookieCount > 0 && (
              <Button variant="destructive" size="sm" onClick={handleClearAllCookies}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>

          {cookieCount === 0 ? (
            <Card className="p-8 text-center">
              <Cookie className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No cookies stored</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {Object.entries(cookies).map(([name, value]) => (
                <Card key={name} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{name}</p>
                      <p className="text-sm text-muted-foreground truncate">{value}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteCookie(name)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Information */}
        <Card className="p-6 bg-muted/50">
          <h3 className="font-semibold mb-2">About Cookies</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Cookies are small text files stored on your device that help us provide a better experience. OpenTune is
            prepared to use cookies for:
          </p>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
            <li>User authentication and session management</li>
            <li>Cross-device playlist synchronization</li>
            <li>Personalized music recommendations</li>
            <li>Remembering your preferences</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-4">
            Currently, OpenTune stores all data locally on your device using browser storage. Cookies will be used when
            user accounts and cloud-based features are added in the future.
          </p>
        </Card>
      </div>
    </div>
  )
}
