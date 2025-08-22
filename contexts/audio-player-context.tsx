"use client"

import type React from "react"
import { createContext, useContext, useReducer, useRef, useEffect, useCallback } from "react"
import { useListeningHistory } from "./listening-history-context"
import { useDownload } from "./download-context"
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
}

function audioPlayerReducer(state: AudioPlayerState, action: AudioPlayerAction): AudioPlayerState {
  switch (action.type) {
    case "SET_TRACK":
      return {
        ...state,
        currentTrack: action.payload,
        currentTime: 0,
        error: null,
      }
    case "SET_QUEUE":
      const startIndex = action.payload.startIndex ?? 0
      return {
        ...state,
        queue: action.payload.tracks,
        currentIndex: startIndex,
        currentTrack: action.payload.tracks[startIndex] || null,
        currentTime: 0,
        error: null,
      }
    case "PLAY":
      return { ...state, isPlaying: true }
    case "PAUSE":
      return { ...state, isPlaying: false }
    case "TOGGLE_PLAY":
      return { ...state, isPlaying: !state.isPlaying }
    case "NEXT_TRACK":
      if (state.currentIndex < state.queue.length - 1) {
        const nextIndex = state.currentIndex + 1
        return {
          ...state,
          currentIndex: nextIndex,
          currentTrack: state.queue[nextIndex],
          currentTime: 0,
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
      return { ...state, error: action.payload, isLoading: false }
    case "SET_VIDEO_MODE":
      if (typeof window !== "undefined") {
        localStorage.setItem("vibetuneVideoMode", action.payload.toString())
      }
      return { ...state, isVideoMode: action.payload }
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
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined)

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(audioPlayerReducer, initialState)
  const videoModeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastAddedTrackRef = useRef<string | null>(null)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const { addToHistory } = useListeningHistory()
  const { isDownloaded, getOfflineAudio } = useDownload()

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
        console.log("[v0] Media Session: Previous track action triggered", {
          currentIndex: state.currentIndex,
          queueLength: state.queue.length,
          canGoPrevious: state.currentIndex > 0,
        })
        if (state.queue.length > 1 && state.currentIndex > 0) {
          dispatch({ type: "PREVIOUS_TRACK" })
        } else {
          dispatch({ type: "SET_CURRENT_TIME", payload: 0 })
        }
      })

      navigator.mediaSession.setActionHandler("nexttrack", () => {
        console.log("[v0] Media Session: Next track action triggered", {
          currentIndex: state.currentIndex,
          queueLength: state.queue.length,
          canGoNext: state.currentIndex < state.queue.length - 1,
        })
        if (state.queue.length > 1 && state.currentIndex < state.queue.length - 1) {
          dispatch({ type: "NEXT_TRACK" })
        } else {
          dispatch({ type: "SET_CURRENT_TIME", payload: 0 })
        }
      })

      navigator.mediaSession.setActionHandler("seekto", (details) => {
        console.log("[v0] Media Session: Seek action triggered", details.seekTime)
        if (details.seekTime !== undefined && details.seekTime >= 0) {
          dispatch({ type: "SET_CURRENT_TIME", payload: details.seekTime })
        }
      })

      navigator.mediaSession.setActionHandler("seekbackward", (details) => {
        console.log("[v0] Media Session: Seek backward action triggered")
        const seekOffset = details.seekOffset || 10
        const newTime = Math.max(0, state.currentTime - seekOffset)
        dispatch({ type: "SET_CURRENT_TIME", payload: newTime })
      })

      navigator.mediaSession.setActionHandler("seekforward", (details) => {
        console.log("[v0] Media Session: Seek forward action triggered")
        const seekOffset = details.seekOffset || 10
        const newTime = Math.min(state.duration, state.currentTime + seekOffset)
        dispatch({ type: "SET_CURRENT_TIME", payload: newTime })
      })

      navigator.mediaSession.playbackState = state.isPlaying ? "playing" : "paused"

      console.log("[v0] Media Session setup completed for:", state.currentTrack.title, {
        queueLength: state.queue.length,
        currentIndex: state.currentIndex,
        hasQueue: state.queue.length > 0,
      })
    } catch (error) {
      console.warn("[v0] Media Session setup failed:", error)
    }
  }, [state.currentTrack, state.currentIndex, state.queue.length, state.isPlaying, state.currentTime, state.duration])

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
        playbackRate: 1,
        position: position,
      })

      navigator.mediaSession.playbackState = state.isPlaying ? "playing" : "paused"

      console.log("[v0] Media Session position state updated successfully")
    } catch (error) {
      console.warn("[v0] Media Session position update failed:", error)
    }
  }, [state.duration, state.currentTime, state.currentTrack, state.isPlaying])

  const playTrack = (track: Track) => {
    dispatch({ type: "SET_QUEUE", payload: { tracks: [track], startIndex: 0 } })
    dispatch({ type: "PLAY" })
  }

  const playQueue = (tracks: Track[], startIndex = 0) => {
    dispatch({ type: "SET_QUEUE", payload: { tracks, startIndex } })
    dispatch({ type: "PLAY" })
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

  const seekTo = (time: number) => {
    dispatch({ type: "SET_CURRENT_TIME", payload: time })
  }

  const setVolume = (volume: number) => {
    dispatch({ type: "SET_VOLUME", payload: volume })
  }

  const setCurrentTime = (time: number) => {
    dispatch({ type: "SET_CURRENT_TIME", payload: time })
  }

  const setDuration = (duration: number) => {
    dispatch({ type: "SET_DURATION", payload: duration })
  }

  useEffect(() => {
    setupMediaSession()
  }, [setupMediaSession])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updatePositionState()
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [state.currentTime, state.duration, state.isPlaying])

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
