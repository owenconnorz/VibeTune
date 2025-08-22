"use client"

import { useState, useEffect } from "react"
import { RedditAuthService } from "@/lib/reddit-auth"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, LogOut, User } from "lucide-react"

interface RedditLoginProps {
  onAuthChange?: (isAuthenticated: boolean) => void
}

export function RedditLogin({ onAuthChange }: RedditLoginProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showWebview, setShowWebview] = useState(false)
  const [authUrl, setAuthUrl] = useState("")
  const authService = RedditAuthService.getInstance()

  useEffect(() => {
    // Check authentication status on mount
    const checkAuth = () => {
      const authenticated = authService.isAuthenticated()
      setIsAuthenticated(authenticated)
      onAuthChange?.(authenticated)
    }

    checkAuth()

    // Listen for storage changes (in case user logs in from another tab)
    const handleStorageChange = () => {
      checkAuth()
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [onAuthChange])

  const handleLogin = async () => {
    setIsLoading(true)
    try {
      const url = authService.getAuthUrl()
      setAuthUrl(url)
      setShowWebview(true)
    } catch (error) {
      console.error("Login error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    authService.logout()
    setIsAuthenticated(false)
    onAuthChange?.(false)
  }

  const handleWebviewMessage = async (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return

    console.log("[v0] Received message:", event.data)

    if (event.data.type === "REDDIT_AUTH_SUCCESS") {
      const { tokens } = event.data
      setIsLoading(true)

      try {
        // Store tokens using auth service
        authService.storeTokens(tokens)
        setIsAuthenticated(true)
        setShowWebview(false)
        onAuthChange?.(true)
      } catch (error) {
        console.error("Token storage error:", error)
      } finally {
        setIsLoading(false)
      }
    } else if (event.data.type === "REDDIT_AUTH_ERROR") {
      console.error("Reddit auth error:", event.data.error, event.data.description)
      setShowWebview(false)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    window.addEventListener("message", handleWebviewMessage)
    return () => window.removeEventListener("message", handleWebviewMessage)
  }, [])

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-sm text-neutral-content">
          <User className="h-4 w-4" />
          <span>Reddit Connected</span>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout} className="h-8 bg-transparent">
          <LogOut className="h-3 w-3 mr-1" />
          Logout
        </Button>
      </div>
    )
  }

  return (
    <>
      <Button onClick={handleLogin} disabled={isLoading} className="bg-orange-600 hover:bg-orange-700 text-white">
        {isLoading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
          </svg>
        )}
        Login with Reddit
      </Button>

      <Dialog open={showWebview} onOpenChange={setShowWebview}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>Login to Reddit</DialogTitle>
          </DialogHeader>
          <div className="flex-1 relative">
            {authUrl && <RedditWebview url={authUrl} onClose={() => setShowWebview(false)} />}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

interface RedditWebviewProps {
  url: string
  onClose: () => void
}

function RedditWebview({ url, onClose }: RedditWebviewProps) {
  const [isLoading, setIsLoading] = useState(true)

  const handleIframeLoad = () => {
    setIsLoading(false)
  }

  return (
    <div className="w-full h-full relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-background">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}
      <iframe
        id="reddit-iframe"
        src={url}
        className="w-full h-full border-0 rounded-lg"
        onLoad={handleIframeLoad}
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
      />
    </div>
  )
}
