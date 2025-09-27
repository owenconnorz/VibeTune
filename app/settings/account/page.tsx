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
  Settings,
  ExternalLink,
  Info,
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
  const { user, signInWithGoogle, signOut, loading, error, clearError } = useAuth()
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
    clearError()
    await signInWithGoogle()
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
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Music className="w-5 h-5" />
              YouTube Status
            </CardTitle>
            <CardDescription className="text-gray-400">
              Your app is using YT music streaming
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-white text-sm font-medium">InnerTube API Active</p>
                  <p className="text-gray-400 text-xs">Direct YouTube Music access without authentication</p>
                </div>
              </div>
              <div className="px-2 py-1 rounded text-xs font-medium bg-green-400/20 text-green-400">Working</div>
            </div>

            <div className="text-sm text-gray-300 space-y-2">
              <p className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                SimpMusic-style audio streaming (no auth required)
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                YouTube Music InnerTube API integration
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Fallback to yt-dlp for audio extraction
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                Enhanced search and browse capabilities
              </p>
            </div>

            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-blue-400 text-sm font-medium">How it works</p>
                  <p className="text-gray-300 text-xs">
                    Your app now uses the same approach as SimpMusic - direct access to YouTube Music's InnerTube API
                    without requiring Google OAuth authentication. This provides reliable music streaming without
                    authentication errors.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
                  Optional enhanced features with Google authentication
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
                      <AlertCircle className="w-5 h-5 text-blue-400" />
                    )}
                    <div>
                      <p className="text-white text-sm font-medium">
                        {ytMusicStatus.loading
                          ? "Checking access..."
                          : ytMusicStatus.hasAccess
                            ? "Enhanced Features Active"
                            : "Basic Features Active"}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {ytMusicStatus.loading
                          ? "Validating permissions"
                          : ytMusicStatus.hasAccess
                            ? "Full authenticated features available"
                            : "Core features work without authentication"}
                      </p>
                    </div>
                  </div>
                  {!ytMusicStatus.loading && (
                    <div
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        ytMusicStatus.hasAccess ? "bg-green-400/20 text-green-400" : "bg-blue-400/20 text-blue-400"
                      }`}
                    >
                      {ytMusicStatus.hasAccess ? "Enhanced" : "Basic"}
                    </div>
                  )}
                </div>

                <div className="text-sm text-gray-300 space-y-2">
                  <p className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    SimpMusic-style streaming (always available)
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Enhanced search and recommendations
                  </p>
                  <p className="flex items-center gap-2">
                    {ytMusicStatus.hasAccess ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-blue-400" />
                    )}
                    Personalized YouTube Music features
                  </p>
                  <p className="flex items-center gap-2">
                    {ytMusicStatus.hasAccess ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-blue-400" />
                    )}
                    Authenticated API access
                  </p>
                </div>

                {!ytMusicStatus.hasAccess && !ytMusicStatus.loading && (
                  <div className="p-3 bg-blue-400/10 border border-blue-400/20 rounded-lg">
                    <p className="text-blue-400 text-sm font-medium mb-1">Basic Mode Active</p>
                    <p className="text-gray-300 text-xs">
                      All core features are working! Sign in for additional personalized features.
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
                  Optional Google Sign-In
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Your app works great without signing in! Connect for additional personalized features.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-red-400 font-medium mb-1">Authentication Error</p>
                        <p className="text-red-300 text-sm mb-3">{error}</p>

                        <div className="bg-blue-500/10 border border-blue-500/20 rounded p-3 mt-3">
                          <p className="text-blue-400 text-sm font-medium mb-1">Don't worry!</p>
                          <p className="text-blue-300 text-xs">
                            Your music app is working perfectly without authentication. All core features including
                            SimpMusic-style streaming are available.
                          </p>
                        </div>

                        {error.includes("Google OAuth is not configured") && (
                          <div className="bg-red-500/5 border border-red-500/10 rounded p-3 mt-3">
                            <p className="text-red-300 text-sm font-medium mb-2">
                              Optional Setup for Enhanced Features:
                            </p>
                            <div className="text-red-200 text-xs space-y-1">
                              <p>
                                1. Go to{" "}
                                <a
                                  href="https://console.cloud.google.com"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline hover:text-red-100"
                                >
                                  Google Cloud Console
                                </a>
                              </p>
                              <p>2. Create OAuth 2.0 credentials</p>
                              <p>3. Add environment variables to Vercel:</p>
                              <div className="bg-black/20 rounded p-2 mt-2 font-mono text-xs">
                                <p>GOOGLE_CLIENT_ID=your_client_id</p>
                                <p>GOOGLE_CLIENT_SECRET=your_client_secret</p>
                              </div>
                            </div>
                          </div>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearError}
                          className="text-red-300 hover:text-red-200 hover:bg-red-500/10 mt-2"
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-zinc-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">No Account Connected</h3>
                  <p className="text-gray-400 text-sm mb-6">
                    Your app is working great! Sign in for additional personalized features.
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

            {error && error.includes("Google OAuth is not configured") && (
              <Card className="bg-zinc-800 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    OAuth Setup Guide
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Step-by-step guide to configure Google OAuth for this application
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        1
                      </div>
                      <div>
                        <p className="text-white font-medium">Create Google Cloud Project</p>
                        <p className="text-gray-400 text-sm">Go to Google Cloud Console and create a new project</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-400 hover:text-blue-300 p-0 h-auto mt-1"
                          onClick={() => window.open("https://console.cloud.google.com", "_blank")}
                        >
                          Open Google Cloud Console <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        2
                      </div>
                      <div>
                        <p className="text-white font-medium">Enable APIs</p>
                        <p className="text-gray-400 text-sm">Enable Google+ API and YouTube Data API v3</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        3
                      </div>
                      <div>
                        <p className="text-white font-medium">Create OAuth Credentials</p>
                        <p className="text-gray-400 text-sm">Create OAuth 2.0 Client ID credentials</p>
                        <div className="bg-zinc-700/50 rounded p-2 mt-2 text-xs">
                          <p className="text-gray-300">Authorized redirect URI:</p>
                          <code className="text-yellow-400">
                            {typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"}
                            /api/auth/callback
                          </code>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        4
                      </div>
                      <div>
                        <p className="text-white font-medium">Add Environment Variables</p>
                        <p className="text-gray-400 text-sm">Add the credentials to your Vercel project settings</p>
                        <div className="bg-black/40 rounded p-3 mt-2 font-mono text-xs">
                          <p className="text-green-400">GOOGLE_CLIENT_ID=your_client_id_here</p>
                          <p className="text-green-400">GOOGLE_CLIENT_SECRET=your_client_secret_here</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-400 hover:text-blue-300 p-0 h-auto mt-2"
                          onClick={() => window.open("https://vercel.com/dashboard", "_blank")}
                        >
                          Open Vercel Dashboard <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-zinc-800 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Additional Features with Google Sign-In</CardTitle>
                <CardDescription className="text-gray-400">
                  Optional enhancements - your app already has all core features!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-gray-300 space-y-3">
                  <div className="flex items-start gap-3">
                    <Music className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium">Enhanced Personalization</p>
                      <p className="text-gray-400 text-xs">Additional personalized recommendations</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium">Authenticated API Features</p>
                      <p className="text-gray-400 text-xs">Access to user-specific YouTube Music data</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium">Cross-Device Sync</p>
                      <p className="text-gray-400 text-xs">Sync preferences across your devices</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <User className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-white font-medium">Profile Integration</p>
                      <p className="text-gray-400 text-xs">Connect with your YouTube Music profile</p>
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
