"use client"

import { useState, useEffect } from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useRouter } from "next/navigation"

export function SupportedDomainsSettings() {
  const router = useRouter()
  const [supportedDomains, setSupportedDomains] = useState({
    "youtu.be": true,
    "m.youtube.com": true,
    "youtube.com": true,
    "www.youtube.com": true,
    "music.youtube.com": true,
  })

  useEffect(() => {
    const savedDomains = localStorage.getItem("supportedDomains")
    if (savedDomains) {
      setSupportedDomains(JSON.parse(savedDomains))
    }
  }, [])

  const handleToggleDomain = (domain: string, checked: boolean) => {
    const updated = { ...supportedDomains, [domain]: checked }
    setSupportedDomains(updated)
    localStorage.setItem("supportedDomains", JSON.stringify(updated))
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background z-30 border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-2xl font-bold">Supported web addresses</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="bg-card rounded-2xl divide-y divide-border">
          {Object.entries(supportedDomains).map(([domain, enabled]) => (
            <div key={domain} className="flex items-center justify-between p-4">
              <span className="font-medium">{domain}</span>
              <Switch checked={enabled} onCheckedChange={(checked) => handleToggleDomain(domain, checked)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
