"use client"
import { useState, useEffect } from "react"
import { ArrowLeft, Shield, Eye, Lock, Globe, UserCheck, Database, AlertCircle, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useSettings } from "@/contexts/settings-context"

export default function PrivacySettingsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { adultContentEnabled, setAdultContentEnabled, isAgeVerified } = useSettings()

  const [privacySettings, setPrivacySettings] = useState({
    shareListeningHistory: false,
    allowAnalytics: true,
    showOnlineStatus: false,
    sharePlaylistsPublicly: false,
    allowPersonalization: true,
    collectUsageData: true,
    enableCrashReports: true,
  })

  const [dataSettings, setDataSettings] = useState({
    saveSearchHistory: true,
    cacheUserPreferences: true,
    syncAcrossDevices: true,
    localStorageOnly: false,
  })

  useEffect(() => {
    loadPrivacySettings()
  }, [])

  const loadPrivacySettings = () => {
    try {
      const savedPrivacy = localStorage.getItem("vibetunePrivacySettings")
      if (savedPrivacy) {
        setPrivacySettings(JSON.parse(savedPrivacy))
      }

      const savedData = localStorage.getItem("vibetuneDataSettings")
      if (savedData) {
        setDataSettings(JSON.parse(savedData))
      }
    } catch (error) {
      console.error("Failed to load privacy settings:", error)
    }
  }

  const savePrivacySettings = (newSettings: typeof privacySettings) => {
    setPrivacySettings(newSettings)
    localStorage.setItem("vibetunePrivacySettings", JSON.stringify(newSettings))
  }

  const saveDataSettings = (newSettings: typeof dataSettings) => {
    setDataSettings(newSettings)
    localStorage.setItem("vibetuneDataSettings", JSON.stringify(newSettings))
  }

  const handleClearAllData = () => {
    if (window.confirm("Are you sure you want to clear all your data? This action cannot be undone.")) {
      // Clear all app-related localStorage
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith("vibetune")) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key))

      // Reset settings to defaults
      setPrivacySettings({
        shareListeningHistory: false,
        allowAnalytics: true,
        showOnlineStatus: false,
        sharePlaylistsPublicly: false,
        allowPersonalization: true,
        collectUsageData: true,
        enableCrashReports: true,
      })

      setDataSettings({
        saveSearchHistory: true,
        cacheUserPreferences: true,
        syncAcrossDevices: true,
        localStorageOnly: false,
      })

      // TODO: Replace with proper toast notification
      window.alert("All data has been cleared successfully.")
    }
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <header className="flex items-center p-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-300 hover:text-white mr-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-2xl font-semibold text-white">Privacy</h1>
      </header>

      <div className="px-4 pb-6 space-y-6">
        {/* Privacy Overview */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-400" />
              Privacy Overview
            </CardTitle>
            <CardDescription className="text-gray-400">Your privacy and data protection status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-zinc-700 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-white">Data Encryption</span>
                </div>
                <p className="text-xs text-gray-400">Your data is encrypted in transit and at rest</p>
              </div>

              <div className="p-3 bg-zinc-700 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-white">Local Storage</span>
                </div>
                <p className="text-xs text-gray-400">Most data is stored locally on your device</p>
              </div>

              <div className="p-3 bg-zinc-700 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-white">Account Status</span>
                </div>
                <p className="text-xs text-gray-400">{user ? "Signed in with Google" : "Using as guest"}</p>
              </div>

              <div className="p-3 bg-zinc-700 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-4 h-4 text-orange-400" />
                  <span className="text-sm font-medium text-white">Data Sharing</span>
                </div>
                <p className="text-xs text-gray-400">
                  {privacySettings.shareListeningHistory ? "Limited sharing enabled" : "No data sharing"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Controls */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white">Privacy Controls</CardTitle>
            <CardDescription className="text-gray-400">Control what data is shared and how it's used</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-700 rounded-lg flex items-center justify-center">
                  <Play className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Adult Content</p>
                  <p className="text-gray-400 text-sm">
                    Enable access to adult video content
                    {!isAgeVerified && adultContentEnabled && (
                      <span className="block text-yellow-400 text-xs mt-1">Age verification required</span>
                    )}
                  </p>
                </div>
              </div>
              <Switch checked={adultContentEnabled} onCheckedChange={setAdultContentEnabled} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-700 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Share Listening History</p>
                  <p className="text-gray-400 text-sm">Allow others to see what you're listening to</p>
                </div>
              </div>
              <Switch
                checked={privacySettings.shareListeningHistory}
                onCheckedChange={(checked) =>
                  savePrivacySettings({ ...privacySettings, shareListeningHistory: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-700 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Public Playlists</p>
                  <p className="text-gray-400 text-sm">Make your playlists discoverable by others</p>
                </div>
              </div>
              <Switch
                checked={privacySettings.sharePlaylistsPublicly}
                onCheckedChange={(checked) =>
                  savePrivacySettings({ ...privacySettings, sharePlaylistsPublicly: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-700 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Show Online Status</p>
                  <p className="text-gray-400 text-sm">Let others see when you're active</p>
                </div>
              </div>
              <Switch
                checked={privacySettings.showOnlineStatus}
                onCheckedChange={(checked) => savePrivacySettings({ ...privacySettings, showOnlineStatus: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Collection */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white">Data Collection</CardTitle>
            <CardDescription className="text-gray-400">Control what data we collect to improve the app</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-700 rounded-lg flex items-center justify-center">
                  <Database className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Usage Analytics</p>
                  <p className="text-gray-400 text-sm">Help improve the app with anonymous usage data</p>
                </div>
              </div>
              <Switch
                checked={privacySettings.allowAnalytics}
                onCheckedChange={(checked) => savePrivacySettings({ ...privacySettings, allowAnalytics: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-700 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Crash Reports</p>
                  <p className="text-gray-400 text-sm">Automatically send crash reports to help fix bugs</p>
                </div>
              </div>
              <Switch
                checked={privacySettings.enableCrashReports}
                onCheckedChange={(checked) => savePrivacySettings({ ...privacySettings, enableCrashReports: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-700 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Personalization</p>
                  <p className="text-gray-400 text-sm">Use your data to provide personalized recommendations</p>
                </div>
              </div>
              <Switch
                checked={privacySettings.allowPersonalization}
                onCheckedChange={(checked) =>
                  savePrivacySettings({ ...privacySettings, allowPersonalization: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Storage */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white">Data Storage</CardTitle>
            <CardDescription className="text-gray-400">Control how your data is stored and synced</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-700 rounded-lg flex items-center justify-center">
                  <Database className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Save Search History</p>
                  <p className="text-gray-400 text-sm">Remember your searches for quick access</p>
                </div>
              </div>
              <Switch
                checked={dataSettings.saveSearchHistory}
                onCheckedChange={(checked) => saveDataSettings({ ...dataSettings, saveSearchHistory: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-700 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Sync Across Devices</p>
                  <p className="text-gray-400 text-sm">Keep your data synced when signed in</p>
                </div>
              </div>
              <Switch
                checked={dataSettings.syncAcrossDevices}
                onCheckedChange={(checked) => saveDataSettings({ ...dataSettings, syncAcrossDevices: checked })}
                disabled={!user}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-700 rounded-lg flex items-center justify-center">
                  <Lock className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Local Storage Only</p>
                  <p className="text-gray-400 text-sm">Keep all data on this device only</p>
                </div>
              </div>
              <Switch
                checked={dataSettings.localStorageOnly}
                onCheckedChange={(checked) => saveDataSettings({ ...dataSettings, localStorageOnly: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white">Data Management</CardTitle>
            <CardDescription className="text-gray-400">Manage and delete your personal data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <h4 className="text-white font-medium">Delete All Data</h4>
              </div>
              <p className="text-gray-300 text-sm mb-4">
                This will permanently delete all your playlists, preferences, and downloaded content. This action cannot
                be undone.
              </p>
              <Button variant="destructive" onClick={handleClearAllData} className="bg-red-600 hover:bg-red-700">
                Delete All My Data
              </Button>
            </div>

            <div className="text-xs text-gray-400 space-y-1">
              <p>• Your Google account information is managed by Google</p>
              <p>• Deleting data only affects this app, not your Google account</p>
              <p>• Some data may be retained for legal or security purposes</p>
              <p>• You can request a copy of your data by contacting support</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
