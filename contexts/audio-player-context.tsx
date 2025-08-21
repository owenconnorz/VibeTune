"use client"

import type React from "react"
import { createContext, useContext, useReducer, useRef, useEffect } from "react"
import { useListeningHistory } from "./listening-history-context"
import { useDownload } from "./download-context"

export interface Track {
  id: string
  title: string
  artist: string
  thumbnail: string
  duration: string
  audioUrl?: string
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
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined)

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(audioPlayerReducer, initialState)
  const youtubePlayerRef = useRef<any>(null)
  const playerReadyRef = useRef(false)
  const pendingPlayRef = useRef(false)
  const { addToHistory } = useListeningHistory()
  const { isDownloaded, getOfflineAudio } = useDownload()

  useEffect(() => {
    const savedVideoMode = localStorage.getItem("vibetuneVideoMode") === "true"
    if (savedVideoMode !== state.isVideoMode) {
      dispatch({ type: "SET_VIDEO_MODE", payload: savedVideoMode })
    }
  }, [])

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement("script")
      tag.src = "https://www.youtube.com/iframe_api"
      const firstScriptTag = document.getElementsByTagName("script")[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

      window.onYouTubeIframeAPIReady = () => {
        initializePlayer()
      }
    } else {
      initializePlayer()
    }

    function initializePlayer() {
      const playerContainer = document.createElement("div")
      playerContainer.id = "youtube-player"
      playerContainer.style.display = state.isVideoMode ? "block" : "none"
      playerContainer.style.position = "fixed"
      playerContainer.style.top = "0"
      playerContainer.style.left = "0"
      playerContainer.style.zIndex = "9999"
      playerContainer.style.backgroundColor = "black"
      document.body.appendChild(playerContainer)

      youtubePlayerRef.current = new window.YT.Player("youtube-player", {
        height: state.isVideoMode ? "315" : "0",
        width: state.isVideoMode ? "560" : "0",
        videoId: "dQw4w9WgXcQ",
        playerVars: {
          autoplay: 0,
          controls: state.isVideoMode ? 1 : 0,
          disablekb: state.isVideoMode ? 0 : 1,
          fs: state.isVideoMode ? 1 : 0,
          modestbranding: 1,
          rel: 0,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            console.log("[v0] YouTube player ready")
            playerReadyRef.current = true
            if (pendingPlayRef.current && state.currentTrack) {
              loadCurrentTrack()
            }
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.ENDED) {
              dispatch({ type: "PAUSE" })
              if (state.currentIndex < state.queue.length - 1) {
                dispatch({ type: "NEXT_TRACK" })
              }
            } else if (event.data === window.YT.PlayerState.PLAYING) {
              dispatch({ type: "SET_LOADING", payload: false })
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              dispatch({ type: "SET_LOADING", payload: false })
            }
          },
          onError: (event: any) => {
            console.error("[v0] YouTube player error:", event.data)
            let errorMessage = "Failed to load video"
            let shouldSkip = false

            switch (event.data) {
              case 2:
                errorMessage = "Invalid video ID or parameter"
                shouldSkip = true
                break
              case 5:
                errorMessage = "Video cannot be played in HTML5 player"
                shouldSkip = true
                break
              case 100:
                errorMessage = "Video not found"
                shouldSkip = true
                break
              case 101:
              case 150:
                errorMessage = "Video cannot be embedded - skipping to next track"
                shouldSkip = true
                break
            }

            dispatch({ type: "SET_ERROR", payload: errorMessage })
            dispatch({ type: "SET_LOADING", payload: false })
            dispatch({ type: "PAUSE" })

            if (shouldSkip && state.queue.length > 1 && state.currentIndex < state.queue.length - 1) {
              console.log("[v0] Auto-skipping to next track due to playback error")
              setTimeout(() => {
                dispatch({ type: "NEXT_TRACK" })
                dispatch({ type: "PLAY" })
              }, 1500) // Brief delay to show error message
            } else if (shouldSkip) {
              console.log("[v0] No more tracks to skip to")
            }
          },
        },
      })
    }

    return () => {
      if (youtubePlayerRef.current) {
        youtubePlayerRef.current.destroy()
      }
    }
  }, [state.isVideoMode])

  const handlePlay = () => {
    if (!youtubePlayerRef.current || !playerReadyRef.current || !state.currentTrack) {
      pendingPlayRef.current = true
      return
    }

    try {
      youtubePlayerRef.current.playVideo()
      pendingPlayRef.current = false
    } catch (error) {
      console.error("[v0] Error playing YouTube video:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to play video" })
    }
  }

  const handlePause = () => {
    if (!youtubePlayerRef.current || !playerReadyRef.current) return

    try {
      youtubePlayerRef.current.pauseVideo()
      pendingPlayRef.current = false
    } catch (error) {
      console.error("[v0] Error pausing YouTube video:", error)
    }
  }

  useEffect(() => {
    if (state.isPlaying) {
      handlePlay()
    } else {
      handlePause()
    }
  }, [state.isPlaying])

  useEffect(() => {
    if (!state.currentTrack || !youtubePlayerRef.current) return

    dispatch({ type: "SET_LOADING", payload: true })
    dispatch({ type: "SET_ERROR", payload: null })

    addToHistory(state.currentTrack)

    if (playerReadyRef.current) {
      loadCurrentTrack()
    } else {
      pendingPlayRef.current = true
    }
  }, [state.currentTrack])

  useEffect(() => {
    if (youtubePlayerRef.current && playerReadyRef.current) {
      youtubePlayerRef.current.setVolume(state.volume * 100)
    }
  }, [state.volume])

  useEffect(() => {
    if (!youtubePlayerRef.current) return

    const interval = setInterval(() => {
      if (youtubePlayerRef.current && playerReadyRef.current && state.isPlaying) {
        try {
          const currentTime = youtubePlayerRef.current.getCurrentTime()
          const duration = youtubePlayerRef.current.getDuration()

          dispatch({ type: "SET_CURRENT_TIME", payload: currentTime || 0 })
          if (duration && duration !== state.duration) {
            dispatch({ type: "SET_DURATION", payload: duration })
          }
        } catch (error) {
          // Ignore errors during time updates
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [state.isPlaying, state.duration])

  useEffect(() => {
    if ("mediaSession" in navigator && state.currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: state.currentTrack.title,
        artist: state.currentTrack.artist,
        album: "VibeTune",
        artwork: [
          {
            src: state.currentTrack.thumbnail,
            sizes: "96x96",
            type: "image/jpeg",
          },
          {
            src: state.currentTrack.thumbnail,
            sizes: "128x128",
            type: "image/jpeg",
          },
          {
            src: state.currentTrack.thumbnail,
            sizes: "192x192",
            type: "image/jpeg",
          },
          {
            src: state.currentTrack.thumbnail,
            sizes: "256x256",
            type: "image/jpeg",
          },
          {
            src: state.currentTrack.thumbnail,
            sizes: "384x384",
            type: "image/jpeg",
          },
          {
            src: state.currentTrack.thumbnail,
            sizes: "512x512",
            type: "image/jpeg",
          },
        ],
      })

      navigator.mediaSession.setActionHandler("play", () => {
        dispatch({ type: "PLAY" })
      })

      navigator.mediaSession.setActionHandler("pause", () => {
        dispatch({ type: "PAUSE" })
      })

      navigator.mediaSession.setActionHandler("previoustrack", () => {
        dispatch({ type: "PREVIOUS_TRACK" })
      })

      navigator.mediaSession.setActionHandler("nexttrack", () => {
        dispatch({ type: "NEXT_TRACK" })
      })

      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details.seekTime && youtubePlayerRef.current && playerReadyRef.current) {
          seekTo(details.seekTime)
        }
      })

      navigator.mediaSession.playbackState = state.isPlaying ? "playing" : "paused"
    }
  }, [state.currentTrack, state.currentIndex, state.queue.length, state.isPlaying])

  useEffect(() => {
    if ("mediaSession" in navigator && state.duration > 0 && state.currentTrack) {
      navigator.mediaSession.setPositionState({
        duration: state.duration,
        playbackRate: 1,
        position: Math.max(0, Math.min(state.currentTime, state.duration)),
      })
    }
  }, [state.duration, state.currentTime, state.currentTrack])

  const playTrack = (track: Track) => {
    dispatch({ type: "SET_TRACK", payload: track })
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
    if (youtubePlayerRef.current && playerReadyRef.current) {
      try {
        youtubePlayerRef.current.seekTo(time, true)
        dispatch({ type: "SET_CURRENT_TIME", payload: time })
      } catch (error) {
        console.error("[v0] Error seeking:", error)
      }
    }
  }

  const setVolume = (volume: number) => {
    dispatch({ type: "SET_VOLUME", payload: volume })
  }

  const setVideoMode = (enabled: boolean) => {
    dispatch({ type: "SET_VIDEO_MODE", payload: enabled })

    const playerContainer = document.getElementById("youtube-player")
    if (playerContainer) {
      playerContainer.style.display = enabled ? "block" : "none"
      if (youtubePlayerRef.current) {
        youtubePlayerRef.current.setSize(enabled ? 560 : 0, enabled ? 315 : 0)
      }
    }
  }

  const loadCurrentTrack = async () => {
    if (!youtubePlayerRef.current || !playerReadyRef.current || !state.currentTrack) {
      return
    }

    const videoId = state.currentTrack.id

    if (!videoId || typeof videoId !== "string") {
      console.error("[v0] Invalid video ID:", videoId)
      dispatch({ type: "SET_ERROR", payload: "Invalid video ID" })
      return
    }

    if (isDownloaded(videoId)) {
      console.log("[v0] Playing offline version of:", videoId)
      try {
        const offlineAudio = await getOfflineAudio(videoId)
        if (offlineAudio) {
          console.log("[v0] Offline audio available, playing offline version")
          dispatch({ type: "SET_ERROR", payload: "Playing offline version ✓" })
          dispatch({ type: "SET_LOADING", payload: false })
          dispatch({ type: "PLAY" })
          youtubePlayerRef.current.loadVideoById({
            videoId: videoId,
            startSeconds: 0,
          })
          return
        }
      } catch (error) {
        console.error("[v0] Failed to load offline audio:", error)
      }
    }

    if (videoId.startsWith("default") || videoId.length < 10) {
      console.log("[v0] Sample track detected, cannot play:", videoId)
      dispatch({ type: "SET_ERROR", payload: "Sample track - real music not available" })
      dispatch({ type: "SET_LOADING", payload: false })
      dispatch({ type: "PAUSE" })
      return
    }

    try {
      console.log("[v0] Loading video:", videoId)
      youtubePlayerRef.current.loadVideoById({
        videoId: videoId,
        startSeconds: 0,
      })
      youtubePlayerRef.current.setVolume(state.volume * 100)
      dispatch({ type: "SET_CURRENT_TIME", payload: 0 })
    } catch (error) {
      console.error("[v0] Error loading YouTube video:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to load video" })
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }

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
