"use client"

import { createContext, useContext, useState, useRef, useEffect, type ReactNode } from "react"
import type { YouTubeVideo } from "@/lib/innertube"
import { historyStorage } from "@/lib/history-storage"
import { extractColorsFromImage, type ExtractedColors } from "@/lib/color-extractor"
import { themeStorage } from "@/lib/theme-storage"

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

interface MusicPlayerContextType {
  currentVideo: YouTubeVideo | null
  isPlaying: boolean
  queue: YouTubeVideo[]
  currentTime: number
  duration: number
  volume: number
  themeColors: ExtractedColors | null
  playVideo: (video: YouTubeVideo) => void
  togglePlay: () => void
  playNext: () => void
  playPrevious: () => void
  addToQueue: (video: YouTubeVideo) => void
  clearQueue: () => void
  seekTo: (time: number) => void
  setVolume: (volume: number) => void
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined)

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const [currentVideo, setCurrentVideo] = useState<YouTubeVideo | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [queue, setQueue] = useState<YouTubeVideo[]>([])
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(100)
  const [themeColors, setThemeColors] = useState<ExtractedColors | null>(null)
  const playerRef = useRef<any>(null)
  const playerContainerRef = useRef<HTMLDivElement | null>(null)
  const timeUpdateInterval = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement("script")
      tag.src = "https://www.youtube.com/iframe_api"
      const firstScriptTag = document.getElementsByTagName("script")[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

      window.onYouTubeIframeAPIReady = () => {
        console.log("[v0] YouTube IFrame API ready")
      }
    }

    return () => {
      if (timeUpdateInterval.current) {
        clearInterval(timeUpdateInterval.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!currentVideo) return

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) {
        setTimeout(initPlayer, 100)
        return
      }

      if (playerRef.current) {
        playerRef.current.loadVideoById(currentVideo.id)
        if (isPlaying) {
          playerRef.current.playVideo()
        }
        return
      }

      // Create hidden container for player
      if (!playerContainerRef.current) {
        playerContainerRef.current = document.createElement("div")
        playerContainerRef.current.id = "youtube-player"
        playerContainerRef.current.style.display = "none"
        document.body.appendChild(playerContainerRef.current)
      }

      playerRef.current = new window.YT.Player("youtube-player", {
        height: "0",
        width: "0",
        videoId: currentVideo.id,
        playerVars: {
          autoplay: isPlaying ? 1 : 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: (event: any) => {
            console.log("[v0] Player ready")
            event.target.setVolume(volume)
            setDuration(event.target.getDuration())
            if (isPlaying) {
              event.target.playVideo()
            }

            // Start time update interval
            if (timeUpdateInterval.current) {
              clearInterval(timeUpdateInterval.current)
            }
            timeUpdateInterval.current = setInterval(() => {
              if (playerRef.current && playerRef.current.getCurrentTime) {
                setCurrentTime(playerRef.current.getCurrentTime())
              }
            }, 100)
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.ENDED) {
              playNext()
            } else if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true)
              setDuration(event.target.getDuration())
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false)
            }
          },
        },
      })
    }

    initPlayer()
  }, [currentVideo])

  useEffect(() => {
    if (!playerRef.current || !playerRef.current.playVideo) return

    if (isPlaying) {
      playerRef.current.playVideo()
    } else {
      playerRef.current.pauseVideo()
    }
  }, [isPlaying])

  useEffect(() => {
    if (!currentVideo) return

    const settings = themeStorage.getSettings()
    if (!settings.dynamicThemeEnabled) {
      setThemeColors(null)
      return
    }

    extractColorsFromImage(currentVideo.thumbnail).then((colors) => {
      setThemeColors(colors)
      applyThemeColors(colors)
    })
  }, [currentVideo])

  useEffect(() => {
    const handleThemeChange = () => {
      const settings = themeStorage.getSettings()
      if (!settings.dynamicThemeEnabled) {
        setThemeColors(null)
        resetThemeColors()
      } else if (currentVideo) {
        extractColorsFromImage(currentVideo.thumbnail).then((colors) => {
          setThemeColors(colors)
          applyThemeColors(colors)
        })
      }
    }

    window.addEventListener("themeSettingsChanged", handleThemeChange)
    return () => window.removeEventListener("themeSettingsChanged", handleThemeChange)
  }, [currentVideo])

  const applyThemeColors = (colors: ExtractedColors) => {
    const root = document.documentElement
    root.style.setProperty("--background", colors.primary)
    root.style.setProperty("--card", colors.secondary)
    root.style.setProperty("--accent", colors.accent)
  }

  const resetThemeColors = () => {
    const root = document.documentElement
    root.style.removeProperty("--background")
    root.style.removeProperty("--card")
    root.style.removeProperty("--accent")
  }

  const playVideo = (video: YouTubeVideo) => {
    setCurrentVideo(video)
    setIsPlaying(true)
    historyStorage.addToHistory({
      id: video.id,
      title: video.title,
      thumbnail: video.thumbnail,
      channelTitle: video.artist || video.channelTitle,
      duration: video.duration,
    })
  }

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const playNext = () => {
    if (queue.length > 0) {
      const nextVideo = queue[0]
      setCurrentVideo(nextVideo)
      setQueue(queue.slice(1))
      setIsPlaying(true)
    } else {
      setIsPlaying(false)
    }
  }

  const playPrevious = () => {
    if (playerRef.current && playerRef.current.seekTo) {
      playerRef.current.seekTo(0)
    }
    setIsPlaying(true)
  }

  const addToQueue = (video: YouTubeVideo) => {
    setQueue([...queue, video])
  }

  const clearQueue = () => {
    setQueue([])
  }

  const seekTo = (time: number) => {
    if (playerRef.current && playerRef.current.seekTo) {
      playerRef.current.seekTo(time, true)
      setCurrentTime(time)
    }
  }

  const setVolume = (newVolume: number) => {
    setVolumeState(newVolume)
    if (playerRef.current && playerRef.current.setVolume) {
      playerRef.current.setVolume(newVolume)
    }
  }

  return (
    <MusicPlayerContext.Provider
      value={{
        currentVideo,
        isPlaying,
        queue,
        currentTime,
        duration,
        volume,
        themeColors,
        playVideo,
        togglePlay,
        playNext,
        playPrevious,
        addToQueue,
        clearQueue,
        seekTo,
        setVolume,
      }}
    >
      {children}
    </MusicPlayerContext.Provider>
  )
}

export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext)
  if (!context) {
    throw new Error("useMusicPlayer must be used within MusicPlayerProvider")
  }
  return context
}
