"use client"

import { createContext, useContext, useState, useRef, useEffect, type ReactNode } from "react"
import type { YouTubeVideo } from "@/lib/innertube"
import { historyStorage } from "@/lib/history-storage"
import { extractColorsFromImage, type ExtractedColors } from "@/lib/color-extractor"
import { themeStorage } from "@/lib/theme-storage"
import { getLikedSongs, toggleLikedSong as toggleLikedSongStorage, isLiked } from "@/lib/liked-storage"

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
  likedSongs: YouTubeVideo[]
  isCurrentLiked: boolean
  repeatMode: "off" | "all" | "one"
  playVideo: (video: YouTubeVideo) => void
  togglePlay: () => void
  playNext: () => void
  playPrevious: () => void
  addToQueue: (video: YouTubeVideo) => void
  clearQueue: () => void
  seekTo: (time: number) => void
  setVolume: (volume: number) => void
  toggleLikedSong: (video: YouTubeVideo) => void
  toggleRepeatMode: () => void
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined)

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const [currentVideo, setCurrentVideo] = useState<YouTubeVideo | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [queue, setQueue] = useState<YouTubeVideo[]>([])
  const [previousTracks, setPreviousTracks] = useState<YouTubeVideo[]>([])
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(() => {
    if (typeof window !== "undefined") {
      const savedVolume = localStorage.getItem("opentune_volume")
      return savedVolume ? Number.parseInt(savedVolume, 10) : 100
    }
    return 100
  })
  const [themeColors, setThemeColors] = useState<ExtractedColors | null>(null)
  const [likedSongs, setLikedSongs] = useState<YouTubeVideo[]>([])
  const [isCurrentLiked, setIsCurrentLiked] = useState(false)
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">(() => {
    if (typeof window !== "undefined") {
      const savedMode = localStorage.getItem("opentune_repeat_mode")
      return (savedMode as "off" | "all" | "one") || "off"
    }
    return "off"
  })
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const playerRef = useRef<any>(null)
  const playerContainerRef = useRef<HTMLDivElement | null>(null)
  const timeUpdateInterval = useRef<NodeJS.Timeout | null>(null)
  const isManualStateChange = useRef(false)
  const [useAudioElement, setUseAudioElement] = useState(true)

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.volume = volume / 100
      console.log("[v0] Audio element created with volume:", volume / 100)

      audioRef.current.addEventListener("timeupdate", () => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime)
        }
      })

      audioRef.current.addEventListener("loadedmetadata", () => {
        if (audioRef.current) {
          setDuration(audioRef.current.duration)
        }
      })

      audioRef.current.addEventListener("ended", () => {
        console.log("[v0] Audio ended, playing next")
        playNext()
      })

      audioRef.current.addEventListener("play", () => {
        if (!isManualStateChange.current) {
          setIsPlaying(true)
        }
        if ("mediaSession" in navigator) {
          navigator.mediaSession.playbackState = "playing"
        }
      })

      audioRef.current.addEventListener("pause", () => {
        if (!isManualStateChange.current) {
          setIsPlaying(false)
        }
        if ("mediaSession" in navigator) {
          navigator.mediaSession.playbackState = "paused"
        }
      })

      audioRef.current.addEventListener("error", (e) => {
        console.error("[v0] Audio error:", e)
        setUseAudioElement(false)
      })
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ""
      }
    }
  }, [])

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

    const loadAudio = async () => {
      if (useAudioElement && audioRef.current) {
        try {
          console.log("[v0] Loading audio stream for:", currentVideo.title)
          const response = await fetch(`/api/video/${currentVideo.id}/stream`)
          const data = await response.json()

          if (data.audioUrl) {
            audioRef.current.src = data.audioUrl
            audioRef.current.volume = volume / 100
            audioRef.current.load()

            if (isPlaying) {
              audioRef.current.play().catch((error) => {
                console.error("[v0] Error playing audio:", error)
                setUseAudioElement(false)
              })
            }
          } else {
            console.log("[v0] No audio URL, falling back to YouTube IFrame")
            setUseAudioElement(false)
          }
        } catch (error) {
          console.error("[v0] Error loading audio stream:", error)
          setUseAudioElement(false)
        }
      } else {
        initPlayer()
      }
    }

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) {
        setTimeout(initPlayer, 100)
        return
      }

      if (playerRef.current) {
        if (typeof playerRef.current.loadVideoById === "function") {
          playerRef.current.loadVideoById(currentVideo.id)
          if (typeof playerRef.current.setVolume === "function") {
            playerRef.current.setVolume(volume)
            console.log("[v0] YouTube player volume set to:", volume)
          }
          if (isPlaying) {
            playerRef.current.playVideo()
          }
        } else {
          console.log("[v0] Player not ready yet, retrying...")
          setTimeout(initPlayer, 100)
        }
        return
      }

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
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: async (event: any) => {
            console.log("[v0] Player ready")
            event.target.setVolume(volume)
            console.log("[v0] YouTube player volume set to:", volume)
            setDuration(event.target.getDuration())

            try {
              const iframe = document.getElementById("youtube-player") as HTMLIFrameElement
              if (iframe) {
                if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
                  const devices = await navigator.mediaDevices.enumerateDevices()
                  const audioOutputs = devices.filter((device) => device.kind === "audiooutput")
                  console.log("[v0] Available audio outputs:", audioOutputs)

                  const defaultSpeaker = audioOutputs.find(
                    (device) =>
                      device.deviceId === "default" ||
                      device.label.toLowerCase().includes("speaker") ||
                      device.label.toLowerCase().includes("loud"),
                  )

                  if (defaultSpeaker && "setSinkId" in HTMLMediaElement.prototype) {
                    console.log("[v0] Setting audio output to:", defaultSpeaker.label)
                  }
                }
              }
            } catch (error) {
              console.error("[v0] Error setting audio output:", error)
            }

            if (isPlaying) {
              event.target.playVideo()
            }

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
              if (!isManualStateChange.current) {
                setIsPlaying(true)
              }
              setDuration(event.target.getDuration())
              if ("mediaSession" in navigator) {
                navigator.mediaSession.playbackState = "playing"
              }
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              if (!isManualStateChange.current) {
                setIsPlaying(false)
              }
            }
            isManualStateChange.current = false
          },
        },
      })
    }

    loadAudio()
  }, [currentVideo, useAudioElement])

  useEffect(() => {
    if (useAudioElement && audioRef.current) {
      isManualStateChange.current = true

      if (isPlaying) {
        audioRef.current.play().catch((error) => {
          console.error("[v0] Error playing audio:", error)
        })
      } else {
        audioRef.current.pause()
      }

      isManualStateChange.current = false
    } else if (playerRef.current && playerRef.current.playVideo) {
      isManualStateChange.current = true

      if (isPlaying) {
        playerRef.current.playVideo()
      } else {
        playerRef.current.pauseVideo()
      }
    }
  }, [isPlaying, useAudioElement])

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
    if (currentVideo) {
      setPreviousTracks((prev) => [...prev, currentVideo])
      console.log("[v0] Added to previous tracks:", currentVideo.title)
    }
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
    console.log("[v0] Toggle play:", !isPlaying)
    setIsPlaying(!isPlaying)
  }

  const playNext = () => {
    console.log("[v0] Play next called, queue length:", queue.length, "repeat mode:", repeatMode)

    if (repeatMode === "one" && currentVideo) {
      console.log("[v0] Repeat one: replaying current song")
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play()
      } else if (playerRef.current && playerRef.current.seekTo) {
        playerRef.current.seekTo(0)
        playerRef.current.playVideo()
      }
      setIsPlaying(true)
      return
    }

    if (queue.length > 0) {
      const nextVideo = queue[0]
      console.log("[v0] Playing next video:", nextVideo.title)
      if (currentVideo) {
        setPreviousTracks((prev) => [...prev, currentVideo])
      }
      setCurrentVideo(nextVideo)
      setQueue(queue.slice(1))
      isManualStateChange.current = true
      setIsPlaying(true)
    } else {
      if (repeatMode === "all" && previousTracks.length > 0) {
        console.log("[v0] Repeat all: restarting from beginning")
        const allTracks = [...previousTracks]
        if (currentVideo) {
          allTracks.push(currentVideo)
        }
        const firstTrack = allTracks[0]
        setCurrentVideo(firstTrack)
        setQueue(allTracks.slice(1))
        setPreviousTracks([])
        isManualStateChange.current = true
        setIsPlaying(true)
        return
      }

      console.log("[v0] No more songs in queue, playback stopped")
      isManualStateChange.current = true
      setIsPlaying(false)
    }
  }

  const playPrevious = () => {
    console.log("[v0] Play previous called, previous tracks length:", previousTracks.length)
    if (currentTime > 3) {
      console.log("[v0] Seeking to start of current song")
      if (audioRef.current) {
        audioRef.current.currentTime = 0
      } else if (playerRef.current && playerRef.current.seekTo) {
        playerRef.current.seekTo(0)
      }
      setIsPlaying(true)
      return
    }

    if (previousTracks.length > 0) {
      const previousVideo = previousTracks[previousTracks.length - 1]
      console.log("[v0] Playing previous video:", previousVideo.title)
      if (currentVideo) {
        setQueue((prev) => [currentVideo, ...prev])
      }
      setCurrentVideo(previousVideo)
      setPreviousTracks((prev) => prev.slice(0, -1))
      setIsPlaying(true)
    } else {
      console.log("[v0] No previous tracks, seeking to start")
      if (audioRef.current) {
        audioRef.current.currentTime = 0
      } else if (playerRef.current && playerRef.current.seekTo) {
        playerRef.current.seekTo(0)
      }
      setIsPlaying(true)
    }
  }

  const addToQueue = (video: YouTubeVideo) => {
    console.log("[v0] Adding to queue:", video.title)
    setQueue([...queue, video])
  }

  const clearQueue = () => {
    console.log("[v0] Clearing queue")
    setQueue([])
  }

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    } else if (playerRef.current && playerRef.current.seekTo) {
      playerRef.current.seekTo(time, true)
      setCurrentTime(time)
    }
  }

  const setVolume = (newVolume: number) => {
    console.log("[v0] Setting volume to:", newVolume)
    setVolumeState(newVolume)

    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100
      console.log("[v0] Audio element volume set to:", newVolume / 100)
    }

    if (playerRef.current && typeof playerRef.current.setVolume === "function") {
      playerRef.current.setVolume(newVolume)
      console.log("[v0] YouTube player volume set to:", newVolume)
    }
  }

  useEffect(() => {
    if (!("mediaSession" in navigator)) return

    navigator.mediaSession.setActionHandler("play", () => {
      console.log("[v0] Media Session: play")
      setIsPlaying(true)
    })

    navigator.mediaSession.setActionHandler("pause", () => {
      console.log("[v0] Media Session: pause")
      setIsPlaying(false)
    })

    navigator.mediaSession.setActionHandler("previoustrack", () => {
      console.log("[v0] Media Session: previous track")
      playPrevious()
    })

    navigator.mediaSession.setActionHandler("nexttrack", () => {
      console.log("[v0] Media Session: next track")
      playNext()
    })

    navigator.mediaSession.setActionHandler("seekbackward", (details) => {
      console.log("[v0] Media Session: seek backward")
      const skipTime = details.seekOffset || 10
      seekTo(Math.max(currentTime - skipTime, 0))
    })

    navigator.mediaSession.setActionHandler("seekforward", (details) => {
      console.log("[v0] Media Session: seek forward")
      const skipTime = details.seekOffset || 10
      seekTo(Math.min(currentTime + skipTime, duration))
    })

    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (details.seekTime !== undefined) {
        console.log("[v0] Media Session: seek to", details.seekTime)
        seekTo(details.seekTime)
      }
    })

    return () => {
      if ("mediaSession" in navigator) {
        navigator.mediaSession.setActionHandler("play", null)
        navigator.mediaSession.setActionHandler("pause", null)
        navigator.mediaSession.setActionHandler("previoustrack", null)
        navigator.mediaSession.setActionHandler("nexttrack", null)
        navigator.mediaSession.setActionHandler("seekbackward", null)
        navigator.mediaSession.setActionHandler("seekforward", null)
        navigator.mediaSession.setActionHandler("seekto", null)
      }
    }
  }, []) // Empty dependency array - register once on mount

  useEffect(() => {
    if (!currentVideo || !("mediaSession" in navigator)) return

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentVideo.title,
      artist: currentVideo.artist || currentVideo.channelTitle,
      album: currentVideo.channelTitle,
      artwork: [
        { src: currentVideo.thumbnail, sizes: "96x96", type: "image/jpeg" },
        { src: currentVideo.thumbnail, sizes: "128x128", type: "image/jpeg" },
        { src: currentVideo.thumbnail, sizes: "192x192", type: "image/jpeg" },
        { src: currentVideo.thumbnail, sizes: "256x256", type: "image/jpeg" },
        { src: currentVideo.thumbnail, sizes: "384x384", type: "image/jpeg" },
        { src: currentVideo.thumbnail, sizes: "512x512", type: "image/jpeg" },
      ],
    })

    return () => {
      if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = null
      }
    }
  }, [currentVideo])

  useEffect(() => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused"
    }
  }, [isPlaying])

  useEffect(() => {
    if ("mediaSession" in navigator && "setPositionState" in navigator.mediaSession && duration > 0) {
      try {
        navigator.mediaSession.setPositionState({
          duration: duration,
          playbackRate: 1.0,
          position: currentTime,
        })
      } catch (error) {
        console.error("[v0] Error setting position state:", error)
      }
    }
  }, [currentTime, duration])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("opentune_volume", volume.toString())
      console.log("[v0] Volume saved to localStorage:", volume)
    }
  }, [volume])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("opentune_repeat_mode", repeatMode)
      console.log("[v0] Repeat mode saved:", repeatMode)
    }
  }, [repeatMode])

  useEffect(() => {
    setLikedSongs(getLikedSongs())
  }, [])

  useEffect(() => {
    if (currentVideo) {
      setIsCurrentLiked(isLiked(currentVideo.id))
    } else {
      setIsCurrentLiked(false)
    }
  }, [currentVideo])

  const toggleLikedSong = (video: YouTubeVideo) => {
    const nowLiked = toggleLikedSongStorage(video)
    setLikedSongs(getLikedSongs())
    if (currentVideo && currentVideo.id === video.id) {
      setIsCurrentLiked(nowLiked)
    }
    console.log("[v0] Toggled liked song:", video.title, "Now liked:", nowLiked)
  }

  const toggleRepeatMode = () => {
    setRepeatMode((current) => {
      if (current === "off") return "all"
      if (current === "all") return "one"
      return "off"
    })
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
        likedSongs,
        isCurrentLiked,
        repeatMode,
        playVideo,
        togglePlay,
        playNext,
        playPrevious,
        addToQueue,
        clearQueue,
        seekTo,
        setVolume,
        toggleLikedSong,
        toggleRepeatMode,
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
