"use client"

import type React from "react"
import { createContext, useReducer, useRef, useCallback, useContext } from "react"
import { useListeningHistory } from "./listening-history-context"

export interface Track {
  id: string
  title: string
  artist: string
  thumbnail: string
  duration: string
  audioUrl?: string
  videoUrl?: string
  isVideo?: boolean
  url?: string
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
  isFullScreenVideo: boolean
  videoQuality: "auto" | "144p" | "240p" | "360p" | "480p" | "720p" | "1080p"
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
  | { type: "SET_BUFFER_PROGRESS"; payload: number }
  | { type: "SET_PLAYBACK_RATE"; payload: number }
  | { type: "SET_CROSSFADE"; payload: { enabled: boolean; duration?: number } }
  | { type: "SET_AUDIO_QUALITY"; payload: "low" | "medium" | "high" | "auto" }
  | { type: "SET_BUFFERING"; payload: boolean }
  | { type: "SET_NETWORK_STATE"; payload: "idle" | "loading" | "loaded" | "error" }
  | { type: "SET_REPEAT_MODE"; payload: "none" | "one" | "all" }
  | { type: "TOGGLE_SHUFFLE" }
  | { type: "SET_GAPLESS_PLAYBACK"; payload: boolean }
  | { type: "SET_FULLSCREEN_VIDEO"; payload: boolean }
  | { type: "SET_VIDEO_QUALITY"; payload: "auto" | "144p" | "240p" | "360p" | "480p" | "720p" | "1080p" }

const initialState: AudioPlayerState = {
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: typeof window !== "undefined" ? Number.parseFloat(localStorage.getItem("vibetuneVolume") || "1") : 1,
  queue: [],
  currentIndex: -1,
  isLoading: false,
  error: null,
  isVideoMode: typeof window !== "undefined" ? localStorage.getItem("vibetuneVideoMode") === "true" : false,
  playerType: null,
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
  isFullScreenVideo: false,
  videoQuality: "auto",
}

function audioPlayerReducer(state: AudioPlayerState, action: AudioPlayerAction): AudioPlayerState {
  switch (action.type) {
    case "SET_TRACK":
      const hasVideoModePreference = typeof window !== "undefined" && localStorage.getItem("vibetuneVideoMode") !== null
      const isVideoTrack =
        action.payload.isVideo ||
        action.payload.url?.includes("youtube.com") ||
        action.payload.url?.includes("youtu.be") ||
        action.payload.url?.includes("eporner.com") ||
        action.payload.id?.startsWith("eporner_")

      const shouldUseVideoMode = hasVideoModePreference ? state.isVideoMode : isVideoTrack

      return {
        ...state,
        currentTrack: action.payload,
        currentTime: 0,
        error: null,
        bufferProgress: 0,
        networkState: "loading",
        isVideoMode: shouldUseVideoMode,
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
    case "SET_FULLSCREEN_VIDEO":
      return { ...state, isFullScreenVideo: action.payload }
    case "SET_VIDEO_QUALITY":
      return { ...state, videoQuality: action.payload }
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
  addToQueue: (track: Track) => void
  playNext: (track: Track) => void
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
  setFullScreenVideo: (enabled: boolean) => void
  setVideoQuality: (quality: "auto" | "144p" | "240p" | "360p" | "480p" | "720p" | "1080p") => void
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined)

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(audioPlayerReducer, initialState)
  const youtubePlayerRef = useRef<any>(null)
  const youtubePlayerReadyRef = useRef<boolean>(false)
  const nativeVideoRef = useRef<HTMLVideoElement | null>(null)
  const nativeAudioRef = useRef<HTMLAudioElement | null>(null)
  const timeUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const historyTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { addToHistory } = useListeningHistory()

  const extractYouTubeVideoId = useCallback((url: string): string | null => {
    if (!url) return null
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
    ]
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        console.log("[v0] Extracted YouTube video ID:", match[1], "from URL:", url)
        return match[1]
      }
    }
    return null
  }, [])

  const fetchYtDlpAudioStream = useCallback(
    async (track: Track): Promise<string | null> => {
      try {
        console.log("[v0] Fetching audio stream for:", track.title)
        const videoId = extractYouTubeVideoId(track.url || track.videoUrl || "")
        if (!videoId) return null

        try {
          console.log("[v0] Trying InnerTube API for audio stream (no auth required)")
          const innerTubeResponse = await fetch(`/api/youtube-music/innertube-audio/${videoId}`)
          if (innerTubeResponse.ok) {
            const innerTubeData = await innerTubeResponse.json()
            if (innerTubeData?.audioUrl) {
              console.log("[v0] Successfully got audio stream from InnerTube API")
              return innerTubeData.audioUrl
            }
          }
        } catch (error) {
          console.log("[v0] InnerTube API failed, trying yt-dlp fallback:", error)
        }

        const response = await fetch(`/api/youtube-music/audio/${videoId}`)
        if (!response.ok) return null

        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          console.error("[v0] yt-dlp response is not JSON, content-type:", contentType)
          return null
        }

        const responseText = await response.text()
        if (!responseText.trim()) return null

        const streamData = JSON.parse(responseText)
        const audioUrl = streamData?.audioUrl

        if (audioUrl && typeof audioUrl === "string") {
          console.log("[v0] Successfully fetched yt-dlp audio stream")
          return audioUrl
        }
        return null
      } catch (error) {
        console.error("[v0] Error fetching audio stream:", error)
        return null
      }
    },
    [extractYouTubeVideoId],
  )

  const playTrack = useCallback((track: Track) => {
    dispatch({ type: "SET_TRACK", payload: track })
  }, [])

  const playQueue = useCallback((tracks: Track[], startIndex?: number) => {
    dispatch({ type: "SET_QUEUE", payload: { tracks, startIndex } })
  }, [])

  const togglePlay = useCallback(() => {
    dispatch({ type: "TOGGLE_PLAY" })
  }, [])

  const nextTrack = useCallback(() => {
    dispatch({ type: "NEXT_TRACK" })
  }, [])

  const previousTrack = useCallback(() => {
    dispatch({ type: "PREVIOUS_TRACK" })
  }, [])

  const seekTo = useCallback(
    (time: number) => {
      const clampedTime = Math.max(0, Math.min(time, state.duration))
      dispatch({ type: "SET_CURRENT_TIME", payload: clampedTime })
    },
    [state.duration],
  )

  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume))
    dispatch({ type: "SET_VOLUME", payload: clampedVolume })
    if (typeof window !== "undefined") {
      localStorage.setItem("vibetuneVolume", clampedVolume.toString())
    }
  }, [])

  const setVideoMode = useCallback((enabled: boolean) => {
    dispatch({ type: "SET_VIDEO_MODE", payload: enabled })
  }, [])

  const setCurrentTime = useCallback((time: number) => {
    dispatch({ type: "SET_CURRENT_TIME", payload: time })
  }, [])

  const setDuration = useCallback((duration: number) => {
    dispatch({ type: "SET_DURATION", payload: duration })
  }, [])

  const setBufferProgress = useCallback((progress: number) => {
    dispatch({ type: "SET_BUFFER_PROGRESS", payload: progress })
  }, [])

  const setPlaybackRate = useCallback((rate: number) => {
    const clampedRate = Math.max(0.25, Math.min(2, rate))
    dispatch({ type: "SET_PLAYBACK_RATE", payload: clampedRate })
  }, [])

  const setCrossfade = useCallback((enabled: boolean, duration?: number) => {
    dispatch({ type: "SET_CROSSFADE", payload: { enabled, duration } })
  }, [])

  const setAudioQuality = useCallback((quality: "low" | "medium" | "high" | "auto") => {
    dispatch({ type: "SET_AUDIO_QUALITY", payload: quality })
  }, [])

  const setBuffering = useCallback((buffering: boolean) => {
    dispatch({ type: "SET_BUFFERING", payload: buffering })
  }, [])

  const setNetworkState = useCallback((networkState: "idle" | "loading" | "loaded" | "error") => {
    dispatch({ type: "SET_NETWORK_STATE", payload: networkState })
  }, [])

  const setRepeatMode = useCallback((mode: "none" | "one" | "all") => {
    dispatch({ type: "SET_REPEAT_MODE", payload: mode })
  }, [])

  const toggleShuffle = useCallback(() => {
    dispatch({ type: "TOGGLE_SHUFFLE" })
  }, [])

  const setGaplessPlayback = useCallback((enabled: boolean) => {
    dispatch({ type: "SET_GAPLESS_PLAYBACK", payload: enabled })
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

  const setFullScreenVideo = useCallback((enabled: boolean) => {
    dispatch({ type: "SET_FULLSCREEN_VIDEO", payload: enabled })
  }, [])

  const setVideoQuality = useCallback((quality: "auto" | "144p" | "240p" | "360p" | "480p" | "720p" | "1080p") => {
    dispatch({ type: "SET_VIDEO_QUALITY", payload: quality })
  }, [])

  const addToQueue = useCallback((track: Track) => {
    dispatch({ type: "SET_QUEUE", payload: { tracks: [...state.queue, track] } })
  }, [state.queue])

  const playNext = useCallback((track: Track) => {
    const newQueue = [...state.queue]
    newQueue.splice(state.currentIndex + 1, 0, track)
    dispatch({ type: "SET_QUEUE", payload: { tracks: newQueue, startIndex: state.currentIndex } })
  }, [state.queue, state.currentIndex])

  const contextValue: AudioPlayerContextType = {
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
    addToQueue,
    playNext,
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
    setFullScreenVideo,
    setVideoQuality,
  }

  return <AudioPlayerContext.Provider value={contextValue}>{children}</AudioPlayerContext.Provider>
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext)
  if (context === undefined) {
    throw new Error("useAudioPlayer must be used within an AudioPlayerProvider")
  }
  return context
}
