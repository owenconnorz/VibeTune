"use client"
import { useState } from "react"
import { ArrowLeft, User, LogOut, LogIn, Shield, Mail, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export default function AccountSettingsPage() {
  const router = useRouter()
  const { user, signInWithGoogle, signOut, loading } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)

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
                  Connect your Google account to access all features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-zinc-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">No Account Connected</h3>
                  <p className="text-gray-400 text-sm mb-6">Sign in with Google to sync your music across devices</p>

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

            {/* Benefits of Signing In */}
            <Card className="bg-zinc-800 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Benefits of Signing In</CardTitle>
                <CardDescription className="text-gray-400">What you get with a Google account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-gray-300 space-y-2">
                  <p>• Sync playlists across all your devices</p>
                  <p>• Import playlists from YouTube</p>
                  <p>• Backup your music preferences</p>
                  <p>• Personalized recommendations</p>
                  <p>• Access to premium features</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
