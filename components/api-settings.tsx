"use client"

import { useState } from "react"
import { ArrowLeft, Check, Loader2, RefreshCw, Server } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { pipedStorage, PIPED_INSTANCES, testPipedInstance } from "@/lib/piped-storage"
import { Switch } from "@/components/ui/switch"

export function ApiSettings() {
  const router = useRouter()
  const [settings, setSettings] = useState(pipedStorage.getSettings())
  const [testing, setTesting] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<
    Record<string, { success: boolean; latency?: number; error?: string }>
  >({})

  const handleInstanceSelect = (instanceUrl: string) => {
    pipedStorage.setPreferredInstance(instanceUrl)
    setSettings(pipedStorage.getSettings())
  }

  const handleToggleAutoFallback = () => {
    const newValue = pipedStorage.toggleAutoFallback()
    setSettings({ ...settings, autoFallback: newValue })
  }

  const handleTestInstance = async (instanceUrl: string) => {
    setTesting(instanceUrl)
    const result = await testPipedInstance(instanceUrl)
    setTestResults((prev) => ({ ...prev, [instanceUrl]: result }))
    setTesting(null)
  }

  const handleTestAll = async () => {
    for (const instance of PIPED_INSTANCES) {
      await handleTestInstance(instance.url)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background z-30 border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-2xl font-bold">API Settings</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6 max-w-2xl">
        {/* Auto Fallback Setting */}
        <div className="bg-card rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-semibold">Auto Fallback</h3>
              <p className="text-sm text-muted-foreground">
                Automatically try other instances if the preferred one fails
              </p>
            </div>
            <Switch checked={settings.autoFallback} onCheckedChange={handleToggleAutoFallback} />
          </div>
        </div>

        {/* Test All Button */}
        <div className="flex justify-end">
          <Button onClick={handleTestAll} variant="outline" size="sm" disabled={testing !== null}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Test All Instances
          </Button>
        </div>

        {/* Piped Instances */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground px-2">Piped API Instances</h2>
          <div className="space-y-2">
            {PIPED_INSTANCES.map((instance) => {
              const isSelected = settings.preferredInstance === instance.url
              const result = testResults[instance.url]
              const isTesting = testing === instance.url

              return (
                <div
                  key={instance.url}
                  className={`bg-card rounded-2xl p-4 transition-all ${isSelected ? "ring-2 ring-primary" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                      <Server className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{instance.name}</h3>
                        {isSelected && <Check className="w-5 h-5 text-primary flex-shrink-0" />}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{instance.url}</p>
                      <p className="text-xs text-muted-foreground mt-1">Region: {instance.region}</p>

                      {/* Test Result */}
                      {result && (
                        <div className="mt-2 text-xs">
                          {result.success ? (
                            <span className="text-green-500">✓ Online ({result.latency}ms)</span>
                          ) : (
                            <span className="text-red-500">✗ {result.error}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant={isSelected ? "default" : "outline"}
                        onClick={() => handleInstanceSelect(instance.url)}
                        disabled={isTesting}
                      >
                        {isSelected ? "Selected" : "Select"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleTestInstance(instance.url)}
                        disabled={isTesting}
                      >
                        {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Info */}
        <div className="bg-muted/50 rounded-2xl p-4">
          <p className="text-sm text-muted-foreground">
            Piped is an open-source YouTube proxy that provides access to YouTube content without API quota limits.
            Select your preferred instance or enable auto fallback to try multiple instances automatically.
          </p>
        </div>
      </div>
    </div>
  )
}
