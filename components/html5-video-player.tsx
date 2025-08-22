"use client"

import { useEffect, useRef, useState } from "react"
import { useAudioPlayer } from "@/contexts/audio-player-context"
import { Button } from "@/components/ui/button"
import { ExternalLink, LogIn } from "lucide-react"

interface HTML5VideoPlayerProps {
  videoUrl: string
  onReady?: () => void
  onError?: (error: any) => void
  showVideo?: boolean
}

export function HTML5VideoPlayer({ videoUrl, onReady, onError, showVideo = false }: HTML5VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const timeUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isDestroyedRef = useRef(false)
  const [iframeError, setIframeError] = useState(false)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [bufferProgress, setBufferProgress] = useState(0)
  const [isBuffering, setIsBuffering] = useState(false)
  const [extractedVideoUrl, setExtractedVideoUrl] = useState<string | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractionFailed, setExtractionFailed] = useState(false)
  const [showAgeVerificationFallback, setShowAgeVerificationFallback] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [authSessionId, setAuthSessionId] = useState<string | null>(null)
  const [showLoginForm, setShowLoginForm] = useState(false)
  const [loginCredentials, setLoginCredentials] = useState({ username: "", password: "" })

  const { state, setCurrentTime, setDuration } = useAudioPlayer()
  const isVideoMode = showVideo || state.isVideoMode

  const isEpornerPageUrl = videoUrl.includes("eporner.com/video-") && !videoUrl.endsWith(".mp4")
  const isPageUrl = isEpornerPageUrl

  const isDirectVideoFile =
    videoUrl.endsWith(".mp4") || videoUrl.endsWith(".webm") || videoUrl.endsWith(".ogg") || videoUrl.endsWith(".mov")

  const handleEpornerAuth = async (username: string, password: string) => {
    setIsAuthenticating(true)
    try {
      console.log("[v0] Attempting eporner authentication")
      const response = await fetch("/api/eporner/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (data.success) {
        console.log("[v0] Authentication successful, session ID:", data.sessionId)
        setAuthSessionId(data.sessionId)
        setShowLoginForm(false)
        setShowAgeVerificationFallback(false)
        // Try loading with authenticated session
        tryAuthenticatedAccess(data.sessionId)
      } else {
        console.log("[v0] Authentication failed:", data.error)
        alert("Login failed: " + data.error)
      }
    } catch (error) {
      console.error("[v0] Authentication error:", error)
      alert("Authentication failed. Please try again.")
    } finally {
      setIsAuthenticating(false)
    }
  }

  const tryAuthenticatedAccess = (sessionId: string) => {
    console.log("[v0] Trying authenticated access with session:", sessionId)
    // Force iframe reload with authentication
    if (iframeRef.current) {
      const proxyUrl = `/api/eporner/proxy?url=${encodeURIComponent(videoUrl)}&sessionId=${sessionId}`
      iframeRef.current.src = proxyUrl
    }
  }

  useEffect(() => {
    if (isEpornerPageUrl) {
      console.log("[v0] Eporner page detected, checking for authentication")
      setExtractionFailed(true) // Skip extraction, go straight to iframe
    }
  }, [videoUrl, isEpornerPageUrl])

  const checkIframeContent = () => {
    try {
      const iframe = iframeRef.current
      if (!iframe || !iframe.contentDocument) return

      const iframeContent = iframe.contentDocument.body?.innerHTML || ""
      const iframeTitle = iframe.contentDocument.title || ""

      console.log("[v0] Checking iframe content, title:", iframeTitle)

      if (
        iframeTitle.includes("Age Verification") ||
        iframeContent.includes("ageverifybox") ||
        iframeContent.includes("Want to watch FREE porn") ||
        iframeContent.includes("age verification")
      ) {
        console.log("[v0] Age verification detected, showing fallback")
        setShowAgeVerificationFallback(true)
      }
    } catch (error) {
      console.log("[v0] Cannot access iframe content (CORS), assuming age verification")
      setShowAgeVerificationFallback(true)
    }
  }

  const effectiveVideoUrl = extractedVideoUrl || videoUrl
  const shouldShowFallback =
    (isPageUrl && (extractionFailed || (!extractedVideoUrl && !isExtracting))) || showAgeVerificationFallback

  useEffect(() => {
    if (shouldShowFallback) {
      console.log("[v0] Rendering fallback UI for eporner video")
      return
    }

    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      console.log("[v0] HTML5 video metadata loaded")
      setDuration?.(video.duration)
      onReady?.()
    }

    const handleError = (error: any) => {
      console.error("[v0] HTML5 video error:", error)
      stopTimeUpdates()
      onError?.(error)
    }

    const handlePlay = () => {
      startTimeUpdates()
      setIsBuffering(false)
    }

    const handlePause = () => {
      stopTimeUpdates()
    }

    const handleWaiting = () => {
      console.log("[v0] Video buffering...")
      setIsBuffering(true)
    }

    const handleCanPlay = () => {
      console.log("[v0] Video can play")
      setIsBuffering(false)
    }

    const handleProgress = () => {
      updateTimeProgress()
    }

    video.addEventListener("loadedmetadata", handleLoadedMetadata)
    video.addEventListener("error", handleError)
    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)
    video.addEventListener("waiting", handleWaiting)
    video.addEventListener("canplay", handleCanPlay)
    video.addEventListener("progress", handleProgress)

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
      video.removeEventListener("error", handleError)
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
      video.removeEventListener("waiting", handleWaiting)
      video.removeEventListener("canplay", handleCanPlay)
      video.removeEventListener("progress", handleProgress)
      stopTimeUpdates()
      isDestroyedRef.current = true
    }
  }, [effectiveVideoUrl, shouldShowFallback, iframeLoaded])

  useEffect(() => {
    if (shouldShowFallback) return

    const video = videoRef.current
    if (!video) return

    try {
      if (state.isPlaying) {
        video.play()
      } else {
        video.pause()
      }
    } catch (error) {
      console.error("[v0] Error controlling HTML5 video playback:", error)
    }
  }, [state.isPlaying, shouldShowFallback])

  useEffect(() => {
    if (shouldShowFallback) return

    const video = videoRef.current
    if (!video) return

    try {
      video.currentTime = state.currentTime
    } catch (error) {
      console.error("[v0] Error seeking HTML5 video:", error)
    }
  }, [state.currentTime, shouldShowFallback])

  useEffect(() => {
    if (shouldShowFallback) return

    const video = videoRef.current
    if (!video) return

    try {
      video.volume = state.volume
    } catch (error) {
      console.error("[v0] Error setting HTML5 video volume:", error)
    }
  }, [state.volume, shouldShowFallback])

  const openInNewTab = () => {
    console.log("[v0] Opening eporner video in new tab:", videoUrl)
    window.open(videoUrl, "_blank", "noopener,noreferrer")
  }

  const updateTimeProgress = () => {
    if (!videoRef.current || isDestroyedRef.current || shouldShowFallback) return

    try {
      const video = videoRef.current
      const currentTime = video.currentTime || 0
      const duration = video.duration || 0

      if (currentTime > 0 && duration > 0) {
        setCurrentTime?.(currentTime)
        setDuration?.(duration)
      }

      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1)
        const bufferPercent = duration > 0 ? (bufferedEnd / duration) * 100 : 0
        setBufferProgress(bufferPercent)
      }
    } catch (error) {
      console.error("[v0] Error updating HTML5 video time progress:", error)
    }
  }

  const startTimeUpdates = () => {
    if (timeUpdateIntervalRef.current) return
    timeUpdateIntervalRef.current = setInterval(updateTimeProgress, 1000)
  }

  const stopTimeUpdates = () => {
    if (timeUpdateIntervalRef.current) {
      clearInterval(timeUpdateIntervalRef.current)
      timeUpdateIntervalRef.current = null
    }
  }

  if (isExtracting || isAuthenticating) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-zinc-900 rounded-lg min-h-[300px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-zinc-400 text-sm">
            {isAuthenticating ? "Authenticating with eporner..." : "Extracting video URL..."}
          </p>
        </div>
      </div>
    )
  }

  if (showLoginForm) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-zinc-900 rounded-lg min-h-[300px]">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-white mb-2">Eporner Login Required</h3>
          <p className="text-zinc-400 text-sm mb-4">Please login to your eporner account to access this content.</p>
        </div>
        <div className="w-full max-w-sm space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={loginCredentials.username}
            onChange={(e) => setLoginCredentials((prev) => ({ ...prev, username: e.target.value }))}
            className="w-full px-3 py-2 bg-zinc-800 text-white rounded border border-zinc-700 focus:border-orange-500 focus:outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            value={loginCredentials.password}
            onChange={(e) => setLoginCredentials((prev) => ({ ...prev, password: e.target.value }))}
            className="w-full px-3 py-2 bg-zinc-800 text-white rounded border border-zinc-700 focus:border-orange-500 focus:outline-none"
          />
          <div className="flex gap-2">
            <Button
              onClick={() => handleEpornerAuth(loginCredentials.username, loginCredentials.password)}
              disabled={!loginCredentials.username || !loginCredentials.password}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Login
            </Button>
            <Button onClick={() => setShowLoginForm(false)} variant="outline" className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (shouldShowFallback) {
    console.log("[v0] Rendering fallback UI for eporner video")

    return (
      <div className="relative">
        <div className="flex flex-col items-center justify-center p-8 bg-zinc-900 rounded-lg min-h-[300px]">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-white mb-2">Adult Content</h3>
            <p className="text-zinc-400 text-sm mb-4">
              This video cannot be embedded due to site restrictions. You can try logging in or watch it on the original
              site.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowLoginForm(true)} className="bg-blue-500 hover:bg-blue-600 text-white">
              <LogIn className="w-4 h-4 mr-2" />
              Login to Eporner
            </Button>
            <Button onClick={openInNewTab} className="bg-orange-500 hover:bg-orange-600 text-white">
              <ExternalLink className="w-4 h-4 mr-2" />
              Watch on Eporner
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {isEpornerPageUrl && authSessionId && (
        <iframe
          ref={iframeRef}
          src={`/api/eporner/proxy?url=${encodeURIComponent(videoUrl)}&sessionId=${authSessionId}`}
          style={{
            width: "100%",
            height: "400px",
            border: "none",
            borderRadius: "8px",
          }}
          allow="autoplay; fullscreen"
          sandbox="allow-scripts allow-same-origin allow-forms"
          onLoad={() => {
            console.log("[v0] Authenticated iframe loaded")
            setIframeLoaded(true)
            checkIframeContent()
          }}
          onError={() => {
            console.log("[v0] Authenticated iframe error")
            setIframeError(true)
          }}
        />
      )}

      {!shouldShowFallback && isDirectVideoFile && (
        <video
          ref={videoRef}
          src={effectiveVideoUrl}
          style={{
            display: isVideoMode ? "block" : "none",
            width: "100%",
            maxWidth: "560px",
            aspectRatio: "16/9",
          }}
          className={isVideoMode ? "rounded-lg overflow-hidden shadow-lg" : ""}
          preload="auto"
          crossOrigin="anonymous"
          controls={isVideoMode}
          playsInline
          webkit-playsinline="true"
        />
      )}
      {isBuffering && isVideoMode && !shouldShowFallback && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
          <div className="text-white text-sm">Buffering... {Math.round(bufferProgress)}%</div>
        </div>
      )}
    </div>
  )
}
