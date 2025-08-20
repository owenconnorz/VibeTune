"use client"

import type React from "react"
import { createContext, useContext, useReducer, useRef, useEffect } from "react"

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
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined)

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(audioPlayerReducer, initialState)
  const youtubePlayerRef = useRef<any>(null)
  const playerReadyRef = useRef(false)
  const pendingPlayRef = useRef(false)

  useEffect(() => {
    // Load YouTube IFrame API
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
      playerContainer.style.display = "none"
      document.body.appendChild(playerContainer)

      youtubePlayerRef.current = new window.YT.Player("youtube-player", {
        height: "0",
        width: "0",
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: () => {
            playerReadyRef.current = true
            if (pendingPlayRef.current && state.currentTrack) {
              handlePlay()
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
            dispatch({ type: "SET_ERROR", payload: "Failed to load video" })
            dispatch({ type: "SET_LOADING", payload: false })
          },
        },
      })
    }

    return () => {
      if (youtubePlayerRef.current) {
        youtubePlayerRef.current.destroy()
      }
    }
  }, [])

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

    try {
      // Load the YouTube video
      youtubePlayerRef.current.loadVideoById(state.currentTrack.id)
      youtubePlayerRef.current.setVolume(state.volume * 100)

      // Reset time tracking
      dispatch({ type: "SET_CURRENT_TIME", payload: 0 })
    } catch (error) {
      console.error("[v0] Error loading YouTube video:", error)
      dispatch({ type: "SET_ERROR", payload: "Failed to load video" })
      dispatch({ type: "SET_LOADING", payload: false })
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
