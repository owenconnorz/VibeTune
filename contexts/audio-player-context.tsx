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
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const playButtonRef = useRef<HTMLButtonElement | null>(null)
  const progressRef = useRef<HTMLInputElement | null>(null)
  const { addToHistory } = useListeningHistory()

  useEffect(() => {
    const manageWakeLock = async () => {
      if (state.isPlaying && state.currentTrack) {
        if (!wakeLockRef.current) {
          wakeLockRef.current = await PermissionsManager.requestWakeLock()
        }
      } else {
        if (wakeLockRef.current) {
          await PermissionsManager.releaseWakeLock()
          wakeLockRef.current = null
        }
      }
    }

    manageWakeLock()
  }, [state.isPlaying, state.currentTrack])

  useEffect(() => {
    return () => {
      if (wakeLockRef.current) {
        PermissionsManager.releaseWakeLock()
      }
    }
  }, [])

  const setVideoMode = useCallback((enabled: boolean) => {
    if (videoModeTimeoutRef.current) {
      clearTimeout(videoModeTimeoutRef.current)
    }

    videoModeTimeoutRef.current = setTimeout(() => {
      dispatch({ type: "SET_VIDEO_MODE", payload: enabled })
      console.log("[v0] Video mode set to:", enabled)
    }, 150)
  }, [])

  useEffect(() => {
    if (state.currentTrack && lastAddedTrackRef.current !== state.currentTrack.id) {
      dispatch({ type: "SET_LOADING", payload: true })
      dispatch({ type: "SET_ERROR", payload: null })
      addToHistory(state.currentTrack)
      lastAddedTrackRef.current = state.currentTrack.id
    }
  }, [state.currentTrack, addToHistory])

  const setupAudioEventHandlers = useCallback(() => {
    if (!audioElementRef.current) return

    const audio = audioElementRef.current

    // Play event handler with visual feedback
    audio.onplaying = () => {
      console.log("[v0] Audio playing event triggered")
      dispatch({ type: "PLAY" })
      dispatch({ type: "SET_BUFFERING", payload: false })
      dispatch({ type: "SET_NETWORK_STATE", payload: "loaded" })

      // Add to history after 10 seconds of playback
      if (state.currentTrack) {
        historyTimeoutRef.current = setTimeout(() => {
          addToHistory(state.currentTrack!)
        }, 10000)
      }
    }

    // Pause event handler
    audio.onpause = () => {
      console.log("[v0] Audio pause event triggered")
      dispatch({ type: "PAUSE" })
      if (historyTimeoutRef.current) {
        clearTimeout(historyTimeoutRef.current)
      }
    }

    // Loading start handler
    audio.onloadstart = () => {
      console.log("[v0] Audio load start")
      dispatch({ type: "SET_LOADING", payload: true })
      dispatch({ type: "SET_NETWORK_STATE", payload: "loading" })

      // Persist playback speed
      if (state.playbackRate !== 1) {
        audio.playbackRate = state.playbackRate
      }
    }

    // Waiting/buffering handler
    audio.onwaiting = () => {
      console.log("[v0] Audio waiting/buffering")
      dispatch({ type: "SET_BUFFERING", payload: true })
    }

    // Time update handler with progress synchronization
    audio.ontimeupdate = () => {
      const currentTime = audio.currentTime
      const duration = audio.duration || 0

      dispatch({ type: "SET_CURRENT_TIME", payload: currentTime })

      // Update buffer progress
      if (audio.buffered.length > 0) {
        const bufferedEnd = audio.buffered.end(audio.buffered.length - 1)
        const bufferProgress = duration > 0 ? (bufferedEnd / duration) * 100 : 0
        dispatch({ type: "SET_BUFFER_PROGRESS", payload: bufferProgress })
      }
    }

    // Metadata loaded handler
    audio.onloadedmetadata = () => {
      console.log("[v0] Audio metadata loaded")
      const duration = audio.duration || 0
      dispatch({ type: "SET_DURATION", payload: duration })
      dispatch({ type: "SET_LOADING", payload: false })
    }

    // Can play through handler with prefetching
    audio.oncanplaythrough = async () => {
      console.log("[v0] Audio can play through")
      dispatch({ type: "SET_NETWORK_STATE", payload: "loaded" })
      dispatch({ type: "SET_BUFFERING", payload: false })

      // Prefetch next track for gapless playback
      if (state.gaplessPlayback && state.currentIndex < state.queue.length - 1) {
        const nextTrack = state.queue[state.currentIndex + 1]
        if (nextTrack && nextTrack.audioUrl) {
          console.log("[v0] Prefetching next track:", nextTrack.title)
          if (!preloadAudioRef.current) {
            preloadAudioRef.current = new Audio()
          }
          preloadAudioRef.current.src = nextTrack.audioUrl
          preloadAudioRef.current.preload = "auto"
        }
      }
    }

    // Error handler
    audio.onerror = () => {
      console.error("[v0] Audio error occurred")
      dispatch({ type: "SET_ERROR", payload: "Failed to load audio" })
      dispatch({ type: "SET_LOADING", payload: false })
      dispatch({ type: "SET_NETWORK_STATE", payload: "error" })
    }

    // Ended handler with auto-advance
    audio.onended = () => {
      console.log("[v0] Audio ended")
      dispatch({ type: "PAUSE" })

      // Auto-advance to next track
      if (state.repeatMode === "one") {
        audio.currentTime = 0
        audio.play()
      } else if (state.currentIndex < state.queue.length - 1 || state.repeatMode === "all") {
        dispatch({ type: "NEXT_TRACK" })
      }
    }

    // Volume change handler
    audio.onvolumechange = () => {
      dispatch({ type: "SET_VOLUME", payload: audio.volume })
    }

    // Rate change handler
    audio.onratechange = () => {
      dispatch({ type: "SET_PLAYBACK_RATE", payload: audio.playbackRate })
    }
  }, [
    state.currentTrack,
    state.playbackRate,
    state.gaplessPlayback,
    state.currentIndex,
    state.queue,
    state.repeatMode,
    addToHistory,
  ])

  const seekTo = useCallback(
    (time: number) => {
      if (audioElementRef.current) {
        const clampedTime = Math.max(0, Math.min(time, state.duration))
        audioElementRef.current.currentTime = clampedTime
        dispatch({ type: "SET_CURRENT_TIME", payload: clampedTime })
        updatePositionState()
      }
    },
    [state.duration],
  )

  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume))
    if (audioElementRef.current) {
      audioElementRef.current.volume = clampedVolume
    }
    dispatch({ type: "SET_VOLUME", payload: clampedVolume })

    // Store volume preference
    if (typeof window !== "undefined") {
      localStorage.setItem("vibetuneVolume", clampedVolume.toString())
    }
  }, [])

  const setPlaybackRate = useCallback((rate: number) => {
    const clampedRate = Math.max(0.25, Math.min(2, rate))
    if (audioElementRef.current) {
      audioElementRef.current.playbackRate = clampedRate
    }
    dispatch({ type: "SET_PLAYBACK_RATE", payload: clampedRate })
    updatePositionState()
  }, [])

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

  const playTrack = (track: Track) => {
    dispatch({ type: "SET_QUEUE", payload: { tracks: [track], startIndex: 0 } })
    dispatch({ type: "PLAY" })

    if (track.isVideo || track.videoUrl) {
      console.log("[v0] Auto-enabling video mode for video track:", track.title)
      setVideoMode(true)
    } else {
      console.log("[v0] Disabling video mode for audio track:", track.title)
      setVideoMode(false)
    }
  }

  const playQueue = (tracks: Track[], startIndex = 0) => {
    dispatch({ type: "SET_QUEUE", payload: { tracks, startIndex } })
    dispatch({ type: "PLAY" })

    const startingTrack = tracks[startIndex]
    if (startingTrack && (startingTrack.isVideo || startingTrack.videoUrl)) {
      console.log("[v0] Auto-enabling video mode for video queue:", startingTrack.title)
      setVideoMode(true)
    } else {
      console.log("[v0] Disabling video mode for audio queue")
      setVideoMode(false)
    }
  }

  const togglePlay = () => {
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

  useEffect(() => {
    if (state.currentTrack) {
      const shouldBeVideoMode = !!(state.currentTrack.isVideo || state.currentTrack.videoUrl)
      if (shouldBeVideoMode !== state.isVideoMode) {
        console.log("[v0] Auto-switching video mode to:", shouldBeVideoMode, "for track:", state.currentTrack.title)
        setVideoMode(shouldBeVideoMode)
      }
    }
  }, [state.currentTrack, state.isVideoMode, setVideoMode])

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
  }, [])

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
