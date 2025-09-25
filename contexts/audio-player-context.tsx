"use client"

import type React from "react"
import { createContext, useContext, useReducer, useRef, useEffect, useCallback } from "react"
import { useListeningHistory } from "./listening-history-context"
import { PermissionsManager } from "@/lib/permissions"

export interface Track {
  id: string
  title: string
  artist: string
  thumbnail: string
  duration: string
  audioUrl?: string
  videoUrl?: string // Add video URL support
  isVideo?: boolean // Flag to indicate video content
  url?: string // Additional URL field for YouTube links
}

interface AudioPlayerState {
  currentTrack: Track | null
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  queue: Track[]
  currentIndex: number
  isLoading: boolean
  error: string | null
  isVideoMode: boolean
  playerType: "youtube" | "native" | null
  // Enhanced audio features
  bufferProgress: number
  playbackRate: number
  crossfadeEnabled: boolean
  crossfadeDuration: number
  audioQuality: "low" | "medium" | "high" | "auto"
  isBuffering: boolean
  networkState: "idle" | "loading" | "loaded" | "error"
  repeatMode: "none" | "one" | "all"
  shuffleEnabled: boolean
  originalQueue: Track[]
  gaplessPlayback: boolean
}

type AudioPlayerAction =
  | { type: "SET_TRACK"; payload: Track }
  | { type: "SET_QUEUE"; payload: { tracks: Track[]; startIndex?: number } }
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "TOGGLE_PLAY" }
  | { type: "NEXT_TRACK" }
  | { type: "PREVIOUS_TRACK" }
  | { type: "SET_CURRENT_TIME"; payload: number }
  | { type: "SET_DURATION"; payload: number }
  | { type: "SET_VOLUME"; payload: number }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_VIDEO_MODE"; payload: boolean }
  | { type: "SET_PLAYER_TYPE"; payload: "youtube" | "native" | null }
  // Enhanced audio actions
  | { type: "SET_BUFFER_PROGRESS"; payload: number }
  | { type: "SET_PLAYBACK_RATE"; payload: number }
  | { type: "SET_CROSSFADE"; payload: { enabled: boolean; duration?: number } }
  | { type: "SET_AUDIO_QUALITY"; payload: "low" | "medium" | "high" | "auto" }
  | { type: "SET_BUFFERING"; payload: boolean }
  | { type: "SET_NETWORK_STATE"; payload: "idle" | "loading" | "loaded" | "error" }
  | { type: "SET_REPEAT_MODE"; payload: "none" | "one" | "all" }
  | { type: "TOGGLE_SHUFFLE" }
  | { type: "SET_GAPLESS_PLAYBACK"; payload: boolean }

const initialState: AudioPlayerState = {
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  queue: [],
  currentIndex: -1,
  isLoading: false,
  error: null,
  isVideoMode: typeof window !== "undefined" ? localStorage.getItem("vibetuneVideoMode") === "true" : false,
  playerType: null,
  // Enhanced audio features
  bufferProgress: 0,
  playbackRate: 1,
  crossfadeEnabled: true,
  crossfadeDuration: 3,
  audioQuality: "auto",
  isBuffering: false,
  networkState: "idle",
  repeatMode: "none",
  shuffleEnabled: false,
  originalQueue: [],
  gaplessPlayback: true,
}

function audioPlayerReducer(state: AudioPlayerState, action: AudioPlayerAction): AudioPlayerState {
  switch (action.type) {
    case "SET_TRACK":
      return {
        ...state,
        currentTrack: action.payload,
        currentTime: 0,
        error: null,
        bufferProgress: 0,
        networkState: "loading",
      }
    case "SET_PLAYER_TYPE":
      return { ...state, playerType: action.payload }
    case "SET_QUEUE":
      const startIndex = action.payload.startIndex ?? 0
      return {
        ...state,
        queue: action.payload.tracks,
        originalQueue: state.shuffleEnabled ? state.originalQueue : action.payload.tracks,
        currentIndex: startIndex,
        currentTrack: action.payload.tracks[startIndex] || null,
        currentTime: 0,
        error: null,
        bufferProgress: 0,
      }
    case "PLAY":
      return { ...state, isPlaying: true }
    case "PAUSE":
      return { ...state, isPlaying: false }
    case "TOGGLE_PLAY":
      return { ...state, isPlaying: !state.isPlaying }
    case "NEXT_TRACK":
      if (state.repeatMode === "one") {
        return { ...state, currentTime: 0 }
      }
      if (state.currentIndex < state.queue.length - 1) {
        const nextIndex = state.currentIndex + 1
        return {
          ...state,
          currentIndex: nextIndex,
          currentTrack: state.queue[nextIndex],
          currentTime: 0,
          bufferProgress: 0,
        }
      } else if (state.repeatMode === "all") {
        return {
          ...state,
          currentIndex: 0,
          currentTrack: state.queue[0],
          currentTime: 0,
          bufferProgress: 0,
        }
      }
      return state
    case "PREVIOUS_TRACK":
      if (state.currentIndex > 0) {
        const prevIndex = state.currentIndex - 1
        return {
          ...state,
          currentIndex: prevIndex,
          currentTrack: state.queue[prevIndex],
          currentTime: 0,
          bufferProgress: 0,
        }
      } else if (state.repeatMode === "all") {
        const lastIndex = state.queue.length - 1
        return {
          ...state,
          currentIndex: lastIndex,
          currentTrack: state.queue[lastIndex],
          currentTime: 0,
          bufferProgress: 0,
        }
      }
      return state
    case "SET_CURRENT_TIME":
      return { ...state, currentTime: action.payload }
    case "SET_DURATION":
      return { ...state, duration: action.payload }
    case "SET_VOLUME":
      return { ...state, volume: Math.max(0, Math.min(1, action.payload)) }
    case "SET_LOADING":
      return { ...state, isLoading: action.payload }
    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false, networkState: "error" }
    case "SET_VIDEO_MODE":
      if (typeof window !== "undefined") {
        localStorage.setItem("vibetuneVideoMode", action.payload.toString())
      }
      return { ...state, isVideoMode: action.payload }
    // Enhanced audio cases
    case "SET_BUFFER_PROGRESS":
      return { ...state, bufferProgress: action.payload }
    case "SET_PLAYBACK_RATE":
      return { ...state, playbackRate: Math.max(0.25, Math.min(2, action.payload)) }
    case "SET_CROSSFADE":
      return {
        ...state,
        crossfadeEnabled: action.payload.enabled,
        crossfadeDuration: action.payload.duration ?? state.crossfadeDuration,
      }
    case "SET_AUDIO_QUALITY":
      return { ...state, audioQuality: action.payload }
    case "SET_BUFFERING":
      return { ...state, isBuffering: action.payload }
    case "SET_NETWORK_STATE":
      return { ...state, networkState: action.payload }
    case "SET_REPEAT_MODE":
      return { ...state, repeatMode: action.payload }
    case "TOGGLE_SHUFFLE":
      const newShuffleEnabled = !state.shuffleEnabled
      if (newShuffleEnabled) {
        // Shuffle the queue
        const currentTrack = state.currentTrack
        const otherTracks = state.queue.filter((_, index) => index !== state.currentIndex)
        const shuffledOthers = [...otherTracks].sort(() => Math.random() - 0.5)
        const newQueue = currentTrack ? [currentTrack, ...shuffledOthers] : shuffledOthers
        return {
          ...state,
          shuffleEnabled: true,
          originalQueue: state.queue,
          queue: newQueue,
          currentIndex: currentTrack ? 0 : -1,
        }
      } else {
        // Restore original queue
        const currentTrack = state.currentTrack
        const originalIndex = currentTrack ? state.originalQueue.findIndex((t) => t.id === currentTrack.id) : -1
        return {
          ...state,
          shuffleEnabled: false,
          queue: state.originalQueue,
          currentIndex: originalIndex,
        }
      }
    case "SET_GAPLESS_PLAYBACK":
      return { ...state, gaplessPlayback: action.payload }
    default:
      return state
  }
}

interface AudioPlayerContextType {
  state: AudioPlayerState
  playTrack: (track: Track) => void
  playQueue: (tracks: Track[], startIndex?: number) => void
  togglePlay: () => void
  nextTrack: () => void
  previousTrack: () => void
  seekTo: (time: number) => void
  setVolume: (volume: number) => void
  setVideoMode: (enabled: boolean) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  // Enhanced audio methods
  setBufferProgress: (progress: number) => void
  setPlaybackRate: (rate: number) => void
  setCrossfade: (enabled: boolean, duration?: number) => void
  setAudioQuality: (quality: "low" | "medium" | "high" | "auto") => void
  setBuffering: (buffering: boolean) => void
  setNetworkState: (state: "idle" | "loading" | "loaded" | "error") => void
  setRepeatMode: (mode: "none" | "one" | "all") => void
  toggleShuffle: () => void
  setGaplessPlayback: (enabled: boolean) => void
  seekForward: (seconds?: number) => void
  seekBackward: (seconds?: number) => void
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined)

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(audioPlayerReducer, initialState)
  const videoModeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastAddedTrackRef = useRef<string | null>(null)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const preloadAudioRef = useRef<HTMLAudioElement | null>(null)
  const crossfadeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const historyTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const youtubePlayerRef = useRef<any>(null)
  const youtubePlayerReadyRef = useRef<boolean>(false)
  const nativeVideoRef = useRef<HTMLVideoElement | null>(null)
  const nativeAudioRef = useRef<HTMLAudioElement | null>(null)
  const playButtonRef = useRef<HTMLButtonElement | null>(null)
  const progressRef = useRef<HTMLInputElement | null>(null)
  const { addToHistory } = useListeningHistory()

  const detectMediaType = useCallback((url: string): "youtube" | "native" => {
    const youtubePatterns = [/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)/, /youtube\.com\/v\//]

    for (const pattern of youtubePatterns) {
      if (pattern.test(url)) return "youtube"
    }

    return "native"
  }, [])

  const createNativeMediaElements = useCallback(() => {
    if (typeof window === "undefined") return

    // Create native video element
    if (!nativeVideoRef.current) {
      const video = document.createElement("video")
      video.style.display = "none"
      video.preload = "metadata"
      video.crossOrigin = "anonymous"
      document.body.appendChild(video)
      nativeVideoRef.current = video
      console.log("[v0] Native video element created")
    }

    // Create native audio element
    if (!nativeAudioRef.current) {
      const audio = document.createElement("audio")
      audio.preload = "metadata"
      audio.crossOrigin = "anonymous"
      document.body.appendChild(audio)
      nativeAudioRef.current = audio
      console.log("[v0] Native audio element created")
    }
  }, [])

  const setupNativeMediaHandlers = useCallback(
    (element: HTMLVideoElement | HTMLAudioElement) => {
      const handleLoadStart = () => {
        console.log("[v0] Native media: Load start")
        dispatch({ type: "SET_LOADING", payload: true })
        dispatch({ type: "SET_NETWORK_STATE", payload: "loading" })
      }

      const handleLoadedMetadata = () => {
        console.log("[v0] Native media: Metadata loaded, duration:", element.duration)
        dispatch({ type: "SET_DURATION", payload: element.duration || 0 })
        dispatch({ type: "SET_LOADING", payload: false })
        dispatch({ type: "SET_NETWORK_STATE", payload: "loaded" })
      }

      const handleCanPlay = () => {
        console.log("[v0] Native media: Can play")
        dispatch({ type: "SET_BUFFERING", payload: false })
      }

      const handlePlay = () => {
        console.log("[v0] Native media: Playing")
        dispatch({ type: "PLAY" })
        startTimeUpdates()
      }

      const handlePause = () => {
        console.log("[v0] Native media: Paused")
        dispatch({ type: "PAUSE" })
        stopTimeUpdates()
      }

      const handleEnded = () => {
        console.log("[v0] Native media: Ended")
        dispatch({ type: "PAUSE" })
        stopTimeUpdates()

        // Auto-advance to next track
        if (state.repeatMode === "one") {
          element.currentTime = 0
          element.play()
        } else if (state.currentIndex < state.queue.length - 1 || state.repeatMode === "all") {
          dispatch({ type: "NEXT_TRACK" })
        }
      }

      const handleTimeUpdate = () => {
        dispatch({ type: "SET_CURRENT_TIME", payload: element.currentTime })
      }

      const handleError = (e: Event) => {
        console.error("[v0] Native media error:", e)
        dispatch({ type: "SET_ERROR", payload: "Media playback error" })
        dispatch({ type: "SET_LOADING", payload: false })
        dispatch({ type: "SET_NETWORK_STATE", payload: "error" })
      }

      const handleWaiting = () => {
        console.log("[v0] Native media: Waiting/buffering")
        dispatch({ type: "SET_BUFFERING", payload: true })
      }

      // Add event listeners
      element.addEventListener("loadstart", handleLoadStart)
      element.addEventListener("loadedmetadata", handleLoadedMetadata)
      element.addEventListener("canplay", handleCanPlay)
      element.addEventListener("play", handlePlay)
      element.addEventListener("pause", handlePause)
      element.addEventListener("ended", handleEnded)
      element.addEventListener("timeupdate", handleTimeUpdate)
      element.addEventListener("error", handleError)
      element.addEventListener("waiting", handleWaiting)

      // Return cleanup function
      return () => {
        element.removeEventListener("loadstart", handleLoadStart)
        element.removeEventListener("loadedmetadata", handleLoadedMetadata)
        element.removeEventListener("canplay", handleCanPlay)
        element.removeEventListener("play", handlePlay)
        element.removeEventListener("pause", handlePause)
        element.removeEventListener("ended", handleEnded)
        element.removeEventListener("timeupdate", handleTimeUpdate)
        element.removeEventListener("error", handleError)
        element.removeEventListener("waiting", handleWaiting)
      }
    },
    [state.repeatMode, state.currentIndex, state.queue],
  )

  useEffect(() => {
    if (typeof window === "undefined") return

    // Create native media elements
    createNativeMediaElements()

    // Load YouTube IFrame API if not already loaded
    try {
      if (!window.YT) {
        const tag = document.createElement("script")
        tag.src = "https://www.youtube.com/iframe_api"
        tag.onerror = () => {
          console.error("[v0] Failed to load YouTube IFrame API")
          dispatch({ type: "SET_ERROR", payload: "Failed to load YouTube player" })
        }
        const firstScriptTag = document.getElementsByTagName("script")[0]
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

        const existingCallback = window.onYouTubeIframeAPIReady
        window.onYouTubeIframeAPIReady = () => {
          try {
            console.log("[v0] YouTube IFrame API loaded")
            if (existingCallback && typeof existingCallback === "function") {
              existingCallback()
            }
            initializeYouTubePlayer()
          } catch (error) {
            console.error("[v0] Error in YouTube API ready callback:", error)
            dispatch({ type: "SET_ERROR", payload: "YouTube player initialization failed" })
          }
        }
      } else if (window.YT.Player) {
        initializeYouTubePlayer()
      }
    } catch (error) {
      console.error("[v0] Error setting up YouTube API:", error)
      dispatch({ type: "SET_ERROR", payload: "YouTube player setup failed" })
    }

    return () => {
      try {
        if (youtubePlayerRef.current) {
          youtubePlayerRef.current.destroy()
          youtubePlayerRef.current = null
          youtubePlayerReadyRef.current = false
          console.log("[v0] YouTube player cleaned up")
        }
        if (nativeVideoRef.current) {
          nativeVideoRef.current.remove()
          nativeVideoRef.current = null
        }
        if (nativeAudioRef.current) {
          nativeAudioRef.current.remove()
          nativeAudioRef.current = null
        }
      } catch (error) {
        console.error("[v0] Error cleaning up media players:", error)
      }
    }
  }, [createNativeMediaElements])

  const initializeYouTubePlayer = useCallback(() => {
    try {
      if (youtubePlayerRef.current || !window.YT?.Player) return

      // Create hidden div for YouTube player
      let playerDiv = document.getElementById("youtube-audio-player")
      if (!playerDiv) {
        playerDiv = document.createElement("div")
        playerDiv.id = "youtube-audio-player"
        playerDiv.style.display = "none"
        document.body.appendChild(playerDiv)
      }

      youtubePlayerRef.current = new window.YT.Player("youtube-audio-player", {
        height: "0",
        width: "0",
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          enablejsapi: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          showinfo: 0,
        },
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange,
          onError: onPlayerError,
        },
      })

      console.log("[v0] YouTube player initialized")
    } catch (error) {
      console.error("[v0] Error initializing YouTube player:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to initialize YouTube player" })
    }
  }, [])

  const onPlayerReady = useCallback(
    (event: any) => {
      console.log("[v0] YouTube player ready")
      youtubePlayerReadyRef.current = true

      // Set initial volume
      if (youtubePlayerRef.current) {
        youtubePlayerRef.current.setVolume(state.volume * 100)
      }
    },
    [state.volume],
  )

  const onPlayerStateChange = useCallback(
    (event: any) => {
      const playerState = event.data
      console.log("[v0] YouTube player state changed:", playerState)

      switch (playerState) {
        case window.YT.PlayerState.PLAYING:
          dispatch({ type: "PLAY" })
          dispatch({ type: "SET_BUFFERING", payload: false })
          dispatch({ type: "SET_NETWORK_STATE", payload: "loaded" })

          // Start time updates
          startTimeUpdates()

          // Add to history after 10 seconds
          if (state.currentTrack) {
            historyTimeoutRef.current = setTimeout(() => {
              addToHistory(state.currentTrack!)
            }, 10000)
          }
          break

        case window.YT.PlayerState.PAUSED:
          dispatch({ type: "PAUSE" })
          stopTimeUpdates()
          if (historyTimeoutRef.current) {
            clearTimeout(historyTimeoutRef.current)
          }
          break

        case window.YT.PlayerState.ENDED:
          dispatch({ type: "PAUSE" })
          stopTimeUpdates()

          // Auto-advance to next track
          if (state.repeatMode === "one") {
            youtubePlayerRef.current?.seekTo(0)
            youtubePlayerRef.current?.playVideo()
          } else if (state.currentIndex < state.queue.length - 1 || state.repeatMode === "all") {
            dispatch({ type: "NEXT_TRACK" })
          }
          break

        case window.YT.PlayerState.BUFFERING:
          dispatch({ type: "SET_BUFFERING", payload: true })
          break

        case window.YT.PlayerState.CUED:
          const duration = youtubePlayerRef.current?.getDuration() || 0
          dispatch({ type: "SET_DURATION", payload: duration })
          dispatch({ type: "SET_LOADING", payload: false })
          break
      }
    },
    [state.currentTrack, state.repeatMode, state.currentIndex, state.queue, addToHistory],
  )

  const onPlayerError = useCallback((event: any) => {
    console.error("[v0] YouTube player error:", event.data)
    let errorMessage = "YouTube playback error"

    switch (event.data) {
      case 2:
        errorMessage = "Invalid video ID"
        break
      case 5:
        errorMessage = "Video cannot be played in HTML5 player"
        break
      case 100:
        errorMessage = "Video not found or private"
        break
      case 101:
      case 150:
        errorMessage = "Video not available for embedded playback"
        break
    }

    dispatch({ type: "SET_ERROR", payload: errorMessage })
    dispatch({ type: "SET_LOADING", payload: false })
    dispatch({ type: "SET_NETWORK_STATE", payload: "error" })
  }, [])

  const timeUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const startTimeUpdates = useCallback(() => {
    if (timeUpdateIntervalRef.current) return

    timeUpdateIntervalRef.current = setInterval(() => {
      if (youtubePlayerRef.current && youtubePlayerReadyRef.current) {
        const currentTime = youtubePlayerRef.current.getCurrentTime() || 0
        const duration = youtubePlayerRef.current.getDuration() || 0

        dispatch({ type: "SET_CURRENT_TIME", payload: currentTime })

        if (duration > 0) {
          dispatch({ type: "SET_DURATION", payload: duration })
        }
      }
    }, 1000)
  }, [])

  const stopTimeUpdates = useCallback(() => {
    if (timeUpdateIntervalRef.current) {
      clearInterval(timeUpdateIntervalRef.current)
      timeUpdateIntervalRef.current = null
    }
  }, [])

  const extractYouTubeVideoId = useCallback((url: string): string | null => {
    if (!url) return null

    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        console.log("[v0] Extracted YouTube video ID:", match[1], "from URL:", url)
        return match[1]
      }
    }

    console.log("[v0] Could not extract YouTube video ID from URL:", url)
    return null
  }, [])

  const fetchYtDlpAudioStream = useCallback(
    async (track: Track): Promise<string | null> => {
      try {
        console.log("[v0] Fetching yt-dlp audio stream for:", track.title)

        // Extract YouTube video ID from track URL
        const videoId = extractYouTubeVideoId(track.url || track.videoUrl || "")
        if (!videoId) {
          console.log("[v0] No YouTube video ID found for yt-dlp stream fetch")
          return null
        }

        // Fetch stream from yt-dlp API
        const response = await fetch(`/api/ytdlp/audio/${videoId}`)
        if (!response.ok) {
          console.error("[v0] yt-dlp stream fetch failed:", response.status)
          return null
        }

        const streamData = await response.json()
        const audioUrl = streamData.audioUrl

        if (audioUrl) {
          console.log("[v0] Successfully fetched yt-dlp audio stream")
          return audioUrl
        }

        return null
      } catch (error) {
        console.error("[v0] Error fetching yt-dlp audio stream:", error)
        return null
      }
    },
    [extractYouTubeVideoId],
  )

  useEffect(() => {
    if (state.currentTrack) {
      console.log("[v0] Loading track:", state.currentTrack.title)

      const loadTrackWithYtDlpFallback = async () => {
        let mediaUrl = state.currentTrack!.videoUrl || state.currentTrack!.audioUrl || state.currentTrack!.url || ""

        if (state.currentTrack!.id.startsWith("mock-") && state.currentTrack!.audioUrl) {
          console.log("[v0] Demo track detected, using direct audio URL:", state.currentTrack!.audioUrl)
          mediaUrl = state.currentTrack!.audioUrl
        } else if (!state.currentTrack!.audioUrl && (state.currentTrack!.url || state.currentTrack!.videoUrl)) {
          console.log("[v0] No direct audio URL, attempting yt-dlp stream fetch")
          const ytDlpAudioUrl = await fetchYtDlpAudioStream(state.currentTrack!)
          if (ytDlpAudioUrl) {
            mediaUrl = ytDlpAudioUrl
            console.log("[v0] Using yt-dlp audio stream:", ytDlpAudioUrl)
          }
        }

        const mediaType = detectMediaType(mediaUrl)
        console.log("[v0] Media URL:", mediaUrl, "Type:", mediaType)
        dispatch({ type: "SET_PLAYER_TYPE", payload: mediaType })

        if (mediaType === "youtube" && youtubePlayerRef.current && youtubePlayerReadyRef.current) {
          // Handle YouTube playback
          const videoId = extractYouTubeVideoId(mediaUrl)
          if (videoId) {
            console.log("[v0] Loading YouTube video ID:", videoId)
            dispatch({ type: "SET_LOADING", payload: true })
            dispatch({ type: "SET_ERROR", payload: null })
            youtubePlayerRef.current.cueVideoById(videoId)
          } else {
            console.log("[v0] No valid YouTube URL found for track:", state.currentTrack!.title)
            dispatch({ type: "SET_ERROR", payload: "No valid YouTube URL found for this track" })
            dispatch({ type: "SET_LOADING", payload: false })
          }
        } else if (mediaType === "native" && mediaUrl) {
          // Handle native media playback
          const isVideo = state.currentTrack!.isVideo || !!state.currentTrack!.videoUrl
          const element = isVideo ? nativeVideoRef.current : nativeAudioRef.current

          if (element) {
            console.log("[v0] Loading native media:", mediaUrl, "Is video:", isVideo)
            dispatch({ type: "SET_LOADING", payload: true })
            dispatch({ type: "SET_ERROR", payload: null })

            // Setup event handlers
            const cleanup = setupNativeMediaHandlers(element)

            // Load the media
            element.src = mediaUrl
            element.volume = state.volume
            element.load()

            // Store cleanup function for later
            element.dataset.cleanup = "true"
          } else {
            console.log("[v0] No media element available")
            dispatch({ type: "SET_ERROR", payload: "Media player not available" })
            dispatch({ type: "SET_LOADING", payload: false })
          }
        } else {
          console.log("[v0] No valid media URL found for track:", state.currentTrack!.title)
          dispatch({ type: "SET_ERROR", payload: "No valid media URL found for this track" })
          dispatch({ type: "SET_LOADING", payload: false })
        }
      }

      loadTrackWithYtDlpFallback()
    }
  }, [
    state.currentTrack,
    detectMediaType,
    extractYouTubeVideoId,
    setupNativeMediaHandlers,
    state.volume,
    fetchYtDlpAudioStream,
  ])

  const setupAudioEventHandlers = useCallback(() => {
    try {
      if (!youtubePlayerRef.current || !youtubePlayerReadyRef.current) return

      // YouTube player events are already handled through the events configuration in initializeYouTubePlayer
      console.log("[v0] YouTube player event handlers already configured through player initialization")
    } catch (error) {
      console.error("[v0] Error setting up audio event handlers:", error)
    }
  }, [state.currentTrack, addToHistory])

  const seekTo = useCallback(
    (time: number) => {
      const clampedTime = Math.max(0, Math.min(time, state.duration))

      if (state.playerType === "youtube" && youtubePlayerRef.current && youtubePlayerReadyRef.current) {
        youtubePlayerRef.current.seekTo(clampedTime, true)
      } else if (state.playerType === "native") {
        const isVideo = state.currentTrack?.isVideo || !!state.currentTrack?.videoUrl
        const element = isVideo ? nativeVideoRef.current : nativeAudioRef.current
        if (element) {
          element.currentTime = clampedTime
        }
      }

      dispatch({ type: "SET_CURRENT_TIME", payload: clampedTime })
      updatePositionState()
    },
    [state.duration, state.playerType, state.currentTrack],
  )

  const setVolume = useCallback(
    (volume: number) => {
      const clampedVolume = Math.max(0, Math.min(1, volume))

      if (state.playerType === "youtube" && youtubePlayerRef.current && youtubePlayerReadyRef.current) {
        youtubePlayerRef.current.setVolume(clampedVolume * 100)
      } else if (state.playerType === "native") {
        if (nativeVideoRef.current) nativeVideoRef.current.volume = clampedVolume
        if (nativeAudioRef.current) nativeAudioRef.current.volume = clampedVolume
      }

      dispatch({ type: "SET_VOLUME", payload: clampedVolume })

      // Store volume preference
      if (typeof window !== "undefined") {
        localStorage.setItem("vibetuneVolume", clampedVolume.toString())
      }
    },
    [state.playerType],
  )

  const setPlaybackRate = useCallback(
    (rate: number) => {
      const clampedRate = Math.max(0.25, Math.min(2, rate))

      if (state.playerType === "youtube" && youtubePlayerRef.current && youtubePlayerReadyRef.current) {
        youtubePlayerRef.current.setPlaybackRate(clampedRate)
      } else if (state.playerType === "native") {
        if (nativeVideoRef.current) nativeVideoRef.current.playbackRate = clampedRate
        if (nativeAudioRef.current) nativeAudioRef.current.playbackRate = clampedRate
      }

      dispatch({ type: "SET_PLAYBACK_RATE", payload: clampedRate })
      updatePositionState()
    },
    [state.playerType],
  )

  const seekForward = useCallback(
    (seconds = 15) => {
      const newTime = Math.min(state.duration, state.currentTime + seconds)
      seekTo(newTime)
    },
    [state.currentTime, state.duration, seekTo],
  )

  const seekBackward = useCallback(
    (seconds = 15) => {
      const newTime = Math.max(0, state.currentTime - seconds)
      seekTo(newTime)
    },
    [state.currentTime, seekTo],
  )

  const setupMediaSession = useCallback(() => {
    if (!("mediaSession" in navigator) || !state.currentTrack) return

    try {
      const artwork = [
        { src: state.currentTrack.thumbnail, sizes: "96x96", type: "image/jpeg" },
        { src: state.currentTrack.thumbnail, sizes: "128x128", type: "image/jpeg" },
        { src: state.currentTrack.thumbnail, sizes: "192x192", type: "image/jpeg" },
        { src: state.currentTrack.thumbnail, sizes: "256x256", type: "image/jpeg" },
        { src: state.currentTrack.thumbnail, sizes: "384x384", type: "image/jpeg" },
        { src: state.currentTrack.thumbnail, sizes: "512x512", type: "image/jpeg" },
        { src: state.currentTrack.thumbnail, sizes: "1024x1024", type: "image/jpeg" },
      ]

      navigator.mediaSession.metadata = new MediaMetadata({
        title: state.currentTrack.title,
        artist: state.currentTrack.artist,
        album: "VibeTune",
        artwork,
      })

      navigator.mediaSession.setActionHandler("play", () => {
        console.log("[v0] Media Session: Play action triggered")
        dispatch({ type: "PLAY" })
      })

      navigator.mediaSession.setActionHandler("pause", () => {
        console.log("[v0] Media Session: Pause action triggered")
        dispatch({ type: "PAUSE" })
      })

      navigator.mediaSession.setActionHandler("stop", () => {
        console.log("[v0] Media Session: Stop action triggered")
        dispatch({ type: "PAUSE" })
        dispatch({ type: "SET_CURRENT_TIME", payload: 0 })
      })

      navigator.mediaSession.setActionHandler("previoustrack", () => {
        console.log("[v0] Media Session: Previous track action triggered")
        dispatch({ type: "PREVIOUS_TRACK" })
      })

      navigator.mediaSession.setActionHandler("nexttrack", () => {
        console.log("[v0] Media Session: Next track action triggered")
        dispatch({ type: "NEXT_TRACK" })
      })

      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details.seekTime !== undefined && details.seekTime >= 0) {
          seekTo(details.seekTime)
        }
      })

      navigator.mediaSession.setActionHandler("seekbackward", (details) => {
        const seekOffset = details.seekOffset || 15
        seekBackward(seekOffset)
      })

      navigator.mediaSession.setActionHandler("seekforward", (details) => {
        const seekOffset = details.seekOffset || 15
        seekForward(seekOffset)
      })

      navigator.mediaSession.playbackState = state.isPlaying ? "playing" : "paused"

      console.log("[v0] Enhanced Media Session setup completed")
    } catch (error) {
      console.warn("[v0] Media Session setup failed:", error)
    }
  }, [state.currentTrack, state.isPlaying, seekTo, seekForward, seekBackward])

  const updatePositionState = useCallback(() => {
    if (!("mediaSession" in navigator) || !state.currentTrack || state.duration <= 0) return

    try {
      const position = Math.max(0, Math.min(state.currentTime, state.duration))

      console.log("[v0] Updating Media Session position state:", {
        duration: state.duration.toFixed(2),
        currentTime: state.currentTime.toFixed(2),
        position: position.toFixed(2),
        isPlaying: state.isPlaying,
      })

      navigator.mediaSession.setPositionState({
        duration: state.duration,
        playbackRate: state.playbackRate,
        position: position,
      })

      navigator.mediaSession.playbackState = state.isPlaying ? "playing" : "paused"

      console.log("[v0] Media Session position state updated successfully")
    } catch (error) {
      console.warn("[v0] Media Session position update failed:", error)
    }
  }, [state.duration, state.currentTime, state.currentTrack, state.isPlaying, state.playbackRate])

  const playTrack = useCallback(async (track: Track) => {
    console.log("[v0] Playing track:", track.title, "Audio URL:", track.audioUrl, "Video URL:", track.videoUrl)

    if (!track.isVideo && !track.videoUrl) {
      console.log("[v0] Disabling video mode for audio track:", track.title)
      dispatch({ type: "SET_VIDEO_MODE", payload: false })
    }

    dispatch({ type: "SET_TRACK", payload: track })
    dispatch({ type: "SET_LOADING", payload: true })
    dispatch({ type: "SET_ERROR", payload: null })

    const hasYouTubeUrl = track.url && (track.url.includes("youtube.com") || track.url.includes("youtu.be"))

    if (hasYouTubeUrl && !track.isVideo) {
      console.log("[v0] YouTube music track detected, will use native player with yt-dlp audio")
      dispatch({ type: "SET_PLAYER_TYPE", payload: "native" })
    } else if (track.audioUrl || track.url) {
      console.log("[v0] Using native audio player for track:", track.title)
      dispatch({ type: "SET_PLAYER_TYPE", payload: "native" })
    } else {
      console.log("[v0] Track has no playable URL, will attempt yt-dlp stream fetch")
      dispatch({ type: "SET_LOADING", payload: true })
    }
  }, [])

  const playQueue = (tracks: Track[], startIndex = 0) => {
    const startingTrack = tracks[startIndex]
    console.log(
      "[v0] Playing queue starting with:",
      startingTrack?.title,
      "Audio URL:",
      startingTrack?.audioUrl || "None",
      "Video URL:",
      startingTrack?.videoUrl || "None",
    )

    dispatch({ type: "SET_QUEUE", payload: { tracks, startIndex } })

    const hasPlayableUrl = startingTrack && (startingTrack.audioUrl || startingTrack.videoUrl || startingTrack.url)
    if (hasPlayableUrl) {
      dispatch({ type: "PLAY" })
    } else {
      console.log("[v0] Starting track has no playable URL, showing info only")
      dispatch({ type: "PAUSE" })
    }

    if (startingTrack && (startingTrack.isVideo || startingTrack.videoUrl)) {
      console.log("[v0] Auto-enabling video mode for video queue:", startingTrack.title)
      dispatch({ type: "SET_VIDEO_MODE", payload: true })
    } else {
      console.log("[v0] Disabling video mode for audio queue")
      dispatch({ type: "SET_VIDEO_MODE", payload: false })
    }
  }

  const togglePlay = () => {
    const hasPlayableUrl =
      state.currentTrack && (state.currentTrack.audioUrl || state.currentTrack.videoUrl || state.currentTrack.url)
    if (!hasPlayableUrl && !state.isPlaying) {
      console.log("[v0] Cannot play: no playable URL available")
      dispatch({ type: "SET_ERROR", payload: "No playable URL available." })
      return
    }

    dispatch({ type: "TOGGLE_PLAY" })
  }

  const nextTrack = () => {
    dispatch({ type: "NEXT_TRACK" })
  }

  const previousTrack = () => {
    dispatch({ type: "PREVIOUS_TRACK" })
  }

  const setCurrentTime = (time: number) => {
    dispatch({ type: "SET_CURRENT_TIME", payload: time })
  }

  const setDuration = (duration: number) => {
    dispatch({ type: "SET_DURATION", payload: duration })
  }

  const setBufferProgress = (progress: number) => {
    dispatch({ type: "SET_BUFFER_PROGRESS", payload: progress })
  }

  const setCrossfade = (enabled: boolean, duration?: number) => {
    dispatch({ type: "SET_CROSSFADE", payload: { enabled, duration } })
  }

  const setAudioQuality = (quality: "low" | "medium" | "high" | "auto") => {
    dispatch({ type: "SET_AUDIO_QUALITY", payload: quality })
  }

  const setBuffering = (buffering: boolean) => {
    dispatch({ type: "SET_BUFFERING", payload: buffering })
  }

  const setNetworkState = (networkState: "idle" | "loading" | "loaded" | "error") => {
    dispatch({ type: "SET_NETWORK_STATE", payload: networkState })
  }

  const setRepeatMode = (mode: "none" | "one" | "all") => {
    dispatch({ type: "SET_REPEAT_MODE", payload: mode })
  }

  const toggleShuffle = () => {
    dispatch({ type: "TOGGLE_SHUFFLE" })
  }

  const setGaplessPlayback = (enabled: boolean) => {
    dispatch({ type: "SET_GAPLESS_PLAYBACK", payload: enabled })
  }

  const setVideoMode = (enabled: boolean) => {
    dispatch({ type: "SET_VIDEO_MODE", payload: enabled })
  }

  useEffect(() => {
    if (state.currentTrack) {
      const shouldBeVideoMode = !!(state.currentTrack.isVideo || state.currentTrack.videoUrl)
      if (shouldBeVideoMode !== state.isVideoMode) {
        console.log("[v0] Auto-switching video mode to:", shouldBeVideoMode, "for track:", state.currentTrack.title)
        setVideoMode(shouldBeVideoMode)
      }
    }
  }, [state.currentTrack, state.isVideoMode])

  useEffect(() => {
    setupAudioEventHandlers()
  }, [setupAudioEventHandlers])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedVolume = localStorage.getItem("vibetuneVolume")
      if (savedVolume) {
        const volume = Number.parseFloat(savedVolume)
        if (!isNaN(volume)) {
          setVolume(volume)
        }
      }
    }
  }, [setVolume])

  useEffect(() => {
    return () => {
      stopTimeUpdates()
      if (historyTimeoutRef.current) {
        clearTimeout(historyTimeoutRef.current)
      }
      if (crossfadeTimeoutRef.current) {
        clearTimeout(crossfadeTimeoutRef.current)
      }
      if (wakeLockRef.current) {
        PermissionsManager.releaseWakeLock()
      }
    }
  }, [stopTimeUpdates])

  return (
    <AudioPlayerContext.Provider
      value={{
        state,
        playTrack,
        playQueue,
        togglePlay,
        nextTrack,
        previousTrack,
        seekTo,
        setVolume,
        setVideoMode,
        setCurrentTime,
        setDuration,
        setBufferProgress,
        setPlaybackRate,
        setCrossfade,
        setAudioQuality,
        setBuffering,
        setNetworkState,
        setRepeatMode,
        toggleShuffle,
        setGaplessPlayback,
        seekForward,
        seekBackward,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  )
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext)
  if (context === undefined) {
    throw new Error("useAudioPlayer must be used within an AudioPlayerProvider")
  }
  return context
}
