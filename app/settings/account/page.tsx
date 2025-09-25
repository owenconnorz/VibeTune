"use client"
import { useState, useEffect } from "react"
import {
  ArrowLeft,
  User,
  LogOut,
  LogIn,
  Shield,
  Mail,
  Calendar,
  MessageSquare,
  Music,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useSettings } from "@/contexts/settings-context"

export default function AccountSettingsPage() {
  const router = useRouter()
  const { user, signInWithGoogle, signOut, loading } = useAuth()
  const {
    discordRpcEnabled,
    setDiscordRpcEnabled,
    discordUser,
    loginToDiscord,
    logoutFromDiscord,
    isDiscordConnected,
  } = useSettings()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [ytMusicStatus, setYtMusicStatus] = useState<{
    hasAccess: boolean
    loading: boolean
  }>({ hasAccess: false, loading: true })

  useEffect(() => {
    if (user) {
      checkYouTubeMusicAccess()
    } else {
      setYtMusicStatus({ hasAccess: false, loading: false })
    }
  }, [user])

  const checkYouTubeMusicAccess = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const data = await response.json()
        setYtMusicStatus({
          hasAccess: data.hasYouTubeMusicAccess || false,
          loading: false,
        })
      }
    } catch (error) {
      console.error("Error checking YouTube Music access:", error)
      setYtMusicStatus({ hasAccess: false, loading: false })
    }
  }

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      await signOut()
      router.push("/")
    } catch (error) {
      console.error("Failed to sign out:", error)
    } finally {
      setIsSigningOut(false)
    }
  }

  const handleSignIn = async () => {
    try {
      await signInWithGoogle()
    } catch (error) {
      console.error("Failed to sign in:", error)
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
        <h1 className="text-2xl font-semibold text-white">Account</h1>
      </header>

      <div className="px-4 pb-6 space-y-6">
        {user ? (
          <>
            {/* User Profile Section */}
            <Card className="bg-zinc-800 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Information
                </CardTitle>
                <CardDescription className="text-gray-400">Your Google account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16 border-2 border-yellow-400">
                    <AvatarImage src={user.picture || "/placeholder.svg"} />
                    <AvatarFallback className="text-xl bg-zinc-700">{user.name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg">{user.name}</h3>
                    <p className="text-gray-400">{user.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 pt-4 border-t border-zinc-700">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-white text-sm font-medium">Email</p>
                      <p className="text-gray-400 text-sm">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-white text-sm font-medium">Account Type</p>
                      <p className="text-gray-400 text-sm">Google Account</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-white text-sm font-medium">Status</p>
                      <p className="text-green-400 text-sm">Active</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-800 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Music className="w-5 h-5" />
                  YouTube Music Integration
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Enhanced music streaming with SimpMusic features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-zinc-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {ytMusicStatus.loading ? (
                      <div className="w-5 h-5 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent" />
                    ) : ytMusicStatus.hasAccess ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-400" />
                    )}
                    <div>
                      <p className="text-white text-sm font-medium">
                        {ytMusicStatus.loading
                          ? "Checking access..."
                          : ytMusicStatus.hasAccess
                            ? "YouTube Music Connected"
                            : "Limited Access"}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {ytMusicStatus.loading
                          ? "Validating permissions"
                          : ytMusicStatus.hasAccess
                            ? "Full SimpMusic features available"
                            : "Basic features only"}
                      </p>
                    </div>
                  </div>
                  {!ytMusicStatus.loading && (
                    <div
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        ytMusicStatus.hasAccess ? "bg-green-400/20 text-green-400" : "bg-yellow-400/20 text-yellow-400"
                      }`}
                    >
                      {ytMusicStatus.hasAccess ? "Connected" : "Limited"}
                    </div>
                  )}
                </div>

                <div className="text-sm text-gray-300 space-y-2">
                  <p className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Enhanced search with SimpMusic integration
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Personalized recommendations
                  </p>
                  <p className="flex items-center gap-2">
                    {ytMusicStatus.hasAccess ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-400" />
                    )}
                    YouTube Music browse API access
                  </p>
                  <p className="flex items-center gap-2">
                    {ytMusicStatus.hasAccess ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-400" />
                    )}
                    Authenticated music streaming
                  </p>
                </div>

                {!ytMusicStatus.hasAccess && !ytMusicStatus.loading && (
                  <div className="p-3 bg-yellow-400/10 border border-yellow-400/20 rounded-lg">
                    <p className="text-yellow-400 text-sm font-medium mb-1">Limited Access Mode</p>
                    <p className="text-gray-300 text-xs">
                      Some features may be limited. Try signing out and back in to refresh permissions.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Discord Integration */}
            <Card className="bg-zinc-800 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Discord Integration
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Connect your Discord account for Rich Presence
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-white font-medium">Discord Rich Presence</p>
                    <p className="text-gray-400 text-sm">Show what you're listening to on Discord</p>
                  </div>
                  <Switch
                    checked={discordRpcEnabled}
                    onCheckedChange={setDiscordRpcEnabled}
                    disabled={!isDiscordConnected}
                    className="data-[state=checked]:bg-yellow-600"
                  />
                </div>

                {isDiscordConnected ? (
                  <div className="flex items-center justify-between p-3 bg-zinc-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage
                          src={
                            discordUser?.avatar
                              ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
                              : undefined
                          }
                        />
                        <AvatarFallback className="text-xs bg-indigo-600">
                          {discordUser?.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-white text-sm font-medium">
                          {discordUser?.username}#{discordUser?.discriminator}
                        </p>
                        <p className="text-green-400 text-xs">Connected</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={logoutFromDiscord}
                      className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                    >
                      <LogOut className="w-4 h-4 mr-1" />
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Button onClick={loginToDiscord} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Connect to Discord
                    </Button>
                    <p className="text-gray-500 text-xs mt-2 text-center">
                      Connect your Discord account to enable Rich Presence
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card className="bg-zinc-800 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Account Actions</CardTitle>
                <CardDescription className="text-gray-400">Manage your account settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant="destructive"
                  className="w-full bg-red-600 hover:bg-red-700"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {isSigningOut ? "Signing out..." : "Sign Out"}
                </Button>
              </CardContent>
            </Card>

            {/* Data & Privacy */}
            <Card className="bg-zinc-800 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Data & Privacy</CardTitle>
                <CardDescription className="text-gray-400">Information about your data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-gray-300 space-y-2">
                  <p>• Your music preferences and playlists are stored locally</p>
                  <p>• Google account information is used for authentication only</p>
                  <p>• No personal data is shared with third parties</p>
                  <p>• You can delete your account data at any time</p>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* Sign In Section */}
            <Card className="bg-zinc-800 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Sign In Required
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Connect your Google account to access enhanced SimpMusic features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-zinc-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">No Account Connected</h3>
                  <p className="text-gray-400 text-sm mb-6">
                    Sign in with Google to unlock SimpMusic integration and enhanced features
                  </p>

                  <Button
                    onClick={handleSignIn}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    {loading ? "Loading..." : "Sign In with Google"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-800 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Enhanced Features with Google Sign-In</CardTitle>
                <CardDescription className="text-gray-400">
                  Unlock SimpMusic integration and premium features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-gray-300 space-y-3">
                  <div className="flex items-start gap-3">
                    <Music className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium">SimpMusic Integration</p>
                      <p className="text-gray-400 text-xs">Enhanced search and browse capabilities</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium">YouTube Music API Access</p>
                      <p className="text-gray-400 text-xs">Authenticated streaming and personalized content</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium">Sync Across Devices</p>
                      <p className="text-gray-400 text-xs">Playlists and preferences synced everywhere</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <User className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium">Personalized Recommendations</p>
                      <p className="text-gray-400 text-xs">AI-powered music discovery based on your taste</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
