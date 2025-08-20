"use client"

import { useEffect } from "react"
import {
  ArrowLeft,
  User,
  Music,
  FolderSyncIcon as Sync,
  LogOut,
  SettingsIcon,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useSync } from "@/contexts/sync-context"

export default function SettingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading, signInWithGoogle, signOut } = useAuth()
  const { syncData, syncStatus, syncSettings, updateSyncSettings, performSync, clearSyncData } = useSync()

  useEffect(() => {
    // Check for OAuth callback results
    const success = searchParams.get("success")
    const error = searchParams.get("error")

    if (success === "connected") {
      console.log("Successfully connected to Google")
    } else if (error) {
      console.error("OAuth error:", error)
    }
  }, [searchParams])

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle()
    } catch (error) {
      console.error("Login failed:", error)
    }
  }

  const handleGoogleLogout = async () => {
    try {
      await signOut()
      clearSyncData()
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const handleSyncNow = async () => {
    if (!user) return
    await performSync()
  }

  const formatLastSyncTime = (isoString: string | null) => {
    if (!isoString) return "Never"
    const date = new Date(isoString)
    return date.toLocaleString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-zinc-800">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-yellow-400" />
            <h1 className="text-xl font-semibold text-white">Settings</h1>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Google Account Section */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="w-5 h-5 text-yellow-400" />
              Google Account
            </CardTitle>
            <CardDescription className="text-gray-400">
              Connect your Google account to sync playlists and music data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!user ? (
              <div className="space-y-4">
                <p className="text-gray-300 text-sm">
                  Sign in with your Google account to access your YouTube Music playlists, liked songs, and enable
                  automatic synchronization.
                </p>
                <Button onClick={handleGoogleLogin} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign in with Google
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={user.picture || "/placeholder.svg"} />
                    <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-white font-medium">{user.name}</p>
                    <p className="text-gray-400 text-sm">{user.email}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={handleGoogleLogout}
                  className="w-full border-zinc-600 text-gray-300 hover:bg-zinc-700 bg-transparent"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sync Settings */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Sync className="w-5 h-5 text-yellow-400" />
              Sync Settings
            </CardTitle>
            <CardDescription className="text-gray-400">Manage how your music data is synchronized</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Auto Sync</p>
                <p className="text-gray-400 text-sm">Automatically sync data when changes are detected</p>
              </div>
              <Switch
                checked={syncSettings.autoSync}
                onCheckedChange={(checked) => updateSyncSettings({ autoSync: checked })}
                disabled={!user}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Sync Playlists</p>
                <p className="text-gray-400 text-sm">Import and sync your YouTube Music playlists</p>
              </div>
              <Switch
                checked={syncSettings.syncPlaylists}
                onCheckedChange={(checked) => updateSyncSettings({ syncPlaylists: checked })}
                disabled={!user}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Sync Liked Songs</p>
                <p className="text-gray-400 text-sm">Import your liked songs from YouTube Music</p>
              </div>
              <Switch
                checked={syncSettings.syncLikedSongs}
                onCheckedChange={(checked) => updateSyncSettings({ syncLikedSongs: checked })}
                disabled={!user}
              />
            </div>

            {syncStatus.isSync && (
              <div className="space-y-3 pt-4 border-t border-zinc-700">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
                  <p className="text-sm text-gray-300">{syncStatus.currentStep}</p>
                </div>
                <Progress value={syncStatus.progress} className="w-full" />
              </div>
            )}

            {syncStatus.error && (
              <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-700 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <p className="text-sm text-red-300">{syncStatus.error}</p>
              </div>
            )}

            {syncStatus.currentStep === "Sync completed successfully" && (
              <div className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-700 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <p className="text-sm text-green-300">Sync completed successfully</p>
              </div>
            )}

            <div className="pt-4 border-t border-zinc-700">
              <Button
                onClick={handleSyncNow}
                disabled={!user || syncStatus.isSync}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-black font-medium disabled:opacity-50"
              >
                <Sync className={`w-4 h-4 mr-2 ${syncStatus.isSync ? "animate-spin" : ""}`} />
                {syncStatus.isSync ? "Syncing..." : "Sync Now"}
              </Button>
              <div className="flex justify-between items-center mt-2">
                <p className="text-gray-400 text-xs">Last synced: {formatLastSyncTime(syncData.lastSyncTime)}</p>
                {syncData.playlists.length > 0 || syncData.likedSongs.length > 0 ? (
                  <p className="text-gray-400 text-xs">
                    {syncData.playlists.length} playlists, {syncData.likedSongs.length} liked songs
                  </p>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Music Preferences */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Music className="w-5 h-5 text-yellow-400" />
              Music Preferences
            </CardTitle>
            <CardDescription className="text-gray-400">Customize your music experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">High Quality Audio</p>
                <p className="text-gray-400 text-sm">Stream music in higher quality when available</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Crossfade</p>
                <p className="text-gray-400 text-sm">Smooth transitions between songs</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
