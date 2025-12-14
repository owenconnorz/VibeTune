"use client"

import { createContext, useContext, useState, useRef, useEffect, type ReactNode } from "react"
import type { YouTubeVideo } from "@/lib/innertube"
import { historyStorage } from "@/lib/history-storage"
import { extractColorsFromImage, type ExtractedColors } from "@/lib/color-extractor"
import { themeStorage } from "@/lib/theme-storage"
import { getLikedSongs, toggleLikedSong as toggleLikedSongStorage } from "@/lib/liked-storage"
import { getDownloadedSong } from "@/lib/download-storage"
import { requestWakeLock, releaseWakeLock } from "@/lib/wake-lock"
import { audioEqualizer } from "@/lib/audio-equalizer"
import { notificationManager } from "@/lib/notification-manager"

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
  videoMode: boolean
  toggleVideoMode: () => void
  playVideo: (video: YouTubeVideo, queueVideos?: YouTubeVideo[]) => void
  togglePlay: () => void
  playNext: () => void
  playPrevious: () => void
  addToQueue: (video: YouTubeVideo) => void
  clearQueue: () => void
  removeFromQueue: (index: number) => void
  reorderQueue: (fromIndex: number, toIndex: number) => void
  shuffleQueue: () => void
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
  const [videoMode, setVideoMode] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const playerRef = useRef<any>(null)
  const playerContainerRef = useRef<HTMLDivElement | null>(null)
  const timeUpdateInterval = useRef<NodeJS.Timeout | null>(null)
  const isManualStateChange = useRef(false)
  const [useAudioElement, setUseAudioElement] = useState(true)

  const playNextRef = useRef<() => void>(() => {})
  const playPreviousRef = useRef<() => void>(() => {})
  const seekToRef = useRef<(time: number) => void>(() => {})

  const setVolume = (volume: number) => {
    setVolumeState(volume)
  }

  const toggleVideoMode = () => {
    console.log("[v0] Toggling video mode, current:", videoMode)
    setVideoMode((prev) => !prev)
    // Force YouTube player when in video mode
    if (!videoMode) {
      setUseAudioElement(false)
    }
  }

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.volume = volume / 100
      console.log("[v0] Audio element created with volume:", volume / 100)

      try {
        audioEqualizer.initialize(audioRef.current)

        // Load and apply saved equalizer settings
        const savedSettings = localStorage.getItem("equalizerSettings")
        if (savedSettings) {
          const settings = JSON.parse(savedSettings)
          if (settings.enabled && settings.gains) {
            audioEqualizer.setAllGains(settings.gains)
            console.log("[v0] Applied saved equalizer settings")
          }
        }
      } catch (error) {
        console.error("[v0] Error initializing equalizer:", error)
        // Continue without equalizer if it fails
      }

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
        console.log("[v0] Audio ended - Current song finished")
        playNext()
      })

      audioRef.current.addEventListener("play", () => {
        setIsPlaying(true)
        if ("mediaSession" in navigator) {
          navigator.mediaSession.playbackState = "playing"
        }
      })

      audioRef.current.addEventListener("pause", () => {
        setIsPlaying(false)
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
      try {
        audioEqualizer.disconnect()
      } catch (error) {
        console.error("[v0] Error disconnecting equalizer:", error)
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
      console.log("[v0] Checking if song is available offline:", currentVideo.title)
      const offlineSong = await getDownloadedSong(currentVideo.id)

      if (offlineSong && audioRef.current) {
        console.log("[v0] Playing from offline storage:", currentVideo.title)
        const blobUrl = URL.createObjectURL(offlineSong.audioBlob)
        audioRef.current.src = blobUrl
        audioRef.current.volume = volume / 100
        audioRef.current.load()

        if (isPlaying) {
          audioRef.current.play().catch((error) => {
            console.error("[v0] Error playing offline audio:", error)
          })
        }
        return
      }

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
              console.log("[v0] YouTube player ended - Current song finished")
              playNext()
            } else if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true)
              setDuration(event.target.getDuration())
              if ("mediaSession" in navigator) {
                navigator.mediaSession.playbackState = "playing"
              }
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false)
            }
          },
        },
      })
    }

    loadAudio()
  }, [currentVideo, useAudioElement])

  useEffect(() => {
    if (!("mediaSession" in navigator)) {
      console.log("[v0] Media Session API not supported")
      return
    }

    if (!currentVideo) {
      console.log("[v0] No current video, clearing metadata")
      navigator.mediaSession.metadata = null
      return
    }

    console.log("[v0] Setting Media Session metadata for:", currentVideo.title)

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentVideo.title,
        artist: currentVideo.artist || currentVideo.channelTitle || "Unknown Artist",
        album: currentVideo.channelTitle || "YouTube Music",
        artwork: [
          {
            src: currentVideo.thumbnail,
            sizes: "512x512",
            type: "image/jpeg",
          },
        ],
      })

      console.log("[v0] ✓ Media Session metadata set successfully")

      if (duration > 0) {
        try {
          navigator.mediaSession.setPositionState({
            duration: duration,
            playbackRate: 1.0,
            position: currentTime,
          })
          console.log("[v0] ✓ Initial position state set - duration:", duration)
        } catch (error) {
          console.error("[v0] ✗ Error setting initial position state:", error)
        }
      }
    } catch (error) {
      console.error("[v0] ✗ Error setting metadata:", error)
    }
  }, [currentVideo, duration])

  useEffect(() => {
    if (!("mediaSession" in navigator)) return
    if (!currentVideo || !isPlaying || duration === 0) return

    console.log("[v0] Starting position state updates")

    const updatePositionState = () => {
      try {
        navigator.mediaSession.setPositionState({
          duration: duration,
          playbackRate: 1.0,
          position: currentTime,
        })
      } catch (error) {
        console.error("[v0] Error updating position state:", error)
      }
    }

    updatePositionState()

    const interval = setInterval(updatePositionState, 1000)

    return () => {
      clearInterval(interval)
      console.log("[v0] Stopped position state updates")
    }
  }, [currentVideo, isPlaying, currentTime, duration])

  useEffect(() => {
    if (!("mediaSession" in navigator)) {
      console.log("[v0] Media Session API not supported")
      return
    }

    console.log("[v0] Registering Media Session action handlers")
    console.log("[v0] Queue length:", queue.length)
    console.log("[v0] Previous tracks length:", previousTracks.length)

    try {
      navigator.mediaSession.setActionHandler("play", () => {
        console.log("[v0] Media Session: play action triggered")
        if (audioRef.current && audioRef.current.paused) {
          console.log("[v0] Playing audio element")
          audioRef.current.play().catch((error) => {
            console.error("[v0] Error playing audio:", error)
          })
        } else if (playerRef.current && playerRef.current.playVideo) {
          console.log("[v0] Playing YouTube player")
          playerRef.current.playVideo()
        }
      })

      navigator.mediaSession.setActionHandler("pause", () => {
        console.log("[v0] Media Session: pause action triggered")
        if (audioRef.current && !audioRef.current.paused) {
          console.log("[v0] Pausing audio element")
          audioRef.current.pause()
        } else if (playerRef.current && playerRef.current.pauseVideo) {
          console.log("[v0] Pausing YouTube player")
          playerRef.current.pauseVideo()
        }
      })

      const shouldShowPrevious = previousTracks.length > 0 || (audioRef.current?.currentTime || 0) > 3

      if (shouldShowPrevious) {
        console.log("[v0] ✓ Registering previoustrack handler")
        navigator.mediaSession.setActionHandler("previoustrack", () => {
          console.log("[v0] Media Session: previous track action triggered")
          playPreviousRef.current()
        })
      } else {
        console.log("[v0] ✗ Unregistering previoustrack handler")
        navigator.mediaSession.setActionHandler("previoustrack", null)
      }

      if (queue.length > 0 || repeatMode !== "off") {
        console.log("[v0] ✓ Registering nexttrack handler")
        navigator.mediaSession.setActionHandler("nexttrack", () => {
          console.log("[v0] Media Session: next track action triggered")
          playNextRef.current()
        })
      } else {
        console.log("[v0] ✗ Unregistering nexttrack handler")
        navigator.mediaSession.setActionHandler("nexttrack", null)
      }

      navigator.mediaSession.setActionHandler("seekbackward", (details) => {
        console.log("[v0] Media Session: seek backward action triggered")
        const skipTime = details.seekOffset || 10
        const currentTimeValue = audioRef.current?.currentTime || playerRef.current?.getCurrentTime?.() || 0
        seekToRef.current(Math.max(currentTimeValue - skipTime, 0))
      })

      navigator.mediaSession.setActionHandler("seekforward", (details) => {
        console.log("[v0] Media Session: seek forward action triggered")
        const skipTime = details.seekOffset || 10
        const currentTimeValue = audioRef.current?.currentTime || playerRef.current?.getCurrentTime?.() || 0
        const durationValue = audioRef.current?.duration || playerRef.current?.getDuration?.() || 0
        seekToRef.current(Math.min(currentTimeValue + skipTime, durationValue))
      })

      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (details.seekTime !== undefined) {
          console.log("[v0] Media Session: seek to action triggered:", details.seekTime)
          seekToRef.current(details.seekTime)
        }
      })

      console.log("[v0] ✓ Media Session action handlers configured successfully")
    } catch (error) {
      console.error("[v0] ✗ Error registering action handlers:", error)
    }

    return () => {
      console.log("[v0] Cleaning up Media Session action handlers")
      if ("mediaSession" in navigator) {
        try {
          navigator.mediaSession.setActionHandler("play", null)
          navigator.mediaSession.setActionHandler("pause", null)
          navigator.mediaSession.setActionHandler("previoustrack", null)
          navigator.mediaSession.setActionHandler("nexttrack", null)
          navigator.mediaSession.setActionHandler("seekbackward", null)
          navigator.mediaSession.setActionHandler("seekforward", null)
          navigator.mediaSession.setActionHandler("seekto", null)
        } catch (error) {
          console.error("[v0] Error cleaning up handlers:", error)
        }
      }
    }
  }, [queue.length, previousTracks.length, repeatMode])

  useEffect(() => {
    playNextRef.current = playNext
    playPreviousRef.current = playPrevious
    seekToRef.current = seekTo
  })

  useEffect(() => {
    if (isPlaying && currentVideo) {
      console.log("[v0] Music playing - requesting wake lock")
      requestWakeLock()
    } else {
      console.log("[v0] Music paused/stopped - releasing wake lock")
      releaseWakeLock()
    }
  }, [isPlaying, currentVideo])

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && isPlaying && currentVideo) {
        console.log("[v0] Page visible and playing - re-acquiring wake lock")
        await requestWakeLock()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      releaseWakeLock()
    }
  }, [isPlaying, currentVideo])

  useEffect(() => {
    if (!currentVideo || !isPlaying) return

    // Show notification if permission is granted
    try {
      if (notificationManager.hasPermission()) {
        notificationManager
          .showNowPlayingNotification(
            currentVideo.title,
            currentVideo.artist || currentVideo.channelTitle || "Unknown Artist",
            currentVideo.thumbnail,
            isPlaying,
          )
          .catch((error) => {
            console.error("[v0] Error showing notification:", error)
          })
      }
    } catch (error) {
      console.error("[v0] Error with notification manager:", error)
    }
  }, [currentVideo, isPlaying])

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "MEDIA_ACTION") {
        console.log("[v0] Received media action from service worker:", event.data.action)

        switch (event.data.action) {
          case "play":
          case "pause":
            togglePlay()
            break
          case "next":
            playNext()
            break
          case "previous":
            playPrevious()
            break
        }
      }
    }

    navigator.serviceWorker.addEventListener("message", handleMessage)

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage)
    }
  }, [])

  const togglePlay = () => {
    console.log("[v0] togglePlay called - current isPlaying:", isPlaying)
    if (!currentVideo) {
      console.log("[v0] No current video to play")
      return
    }

    const isAudioPlaying = audioRef.current && !audioRef.current.paused
    const isYouTubePlaying =
      playerRef.current &&
      playerRef.current.getPlayerState &&
      playerRef.current.getPlayerState() === window.YT?.PlayerState?.PLAYING

    console.log("[v0] Audio element playing:", isAudioPlaying)
    console.log("[v0] YouTube player playing:", isYouTubePlaying)

    if (isAudioPlaying) {
      console.log("[v0] Pausing audio element")
      audioRef.current.pause()
    } else if (isYouTubePlaying) {
      console.log("[v0] Pausing YouTube player")
      playerRef.current.pauseVideo()
    } else if (audioRef.current && audioRef.current.src) {
      console.log("[v0] Playing audio element")
      audioRef.current.play().catch((error) => {
        console.error("[v0] Error playing audio:", error)
      })
    } else if (playerRef.current && playerRef.current.playVideo) {
      console.log("[v0] Playing YouTube player")
      playerRef.current.playVideo()
    } else {
      console.log("[v0] No playback source available")
    }
  }

  const playNext = () => {
    console.log("[v0] ===== PLAY NEXT CALLED =====")
    console.log("[v0] Current video:", currentVideo?.title)
    console.log("[v0] Queue length:", queue.length)
    console.log("[v0] Repeat mode:", repeatMode)
    console.log("[v0] Previous tracks:", previousTracks.length)

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
      console.log("[v0] ✓ Playing next video from queue:", nextVideo.title)
      if (currentVideo) {
        setPreviousTracks((prev) => [...prev, currentVideo])
      }
      setCurrentVideo(nextVideo)
      setQueue(queue.slice(1))
      setIsPlaying(true)
    } else {
      if (repeatMode === "all" && previousTracks.length > 0) {
        console.log("[v0] Repeat all: restarting from beginning")
        const allTracks = [...previousTracks]
        if (currentVideo) {
          allTracks.push(currentVideo)
        }
        const firstTrack = allTracks[0]
        console.log("[v0] ✓ Restarting with:", firstTrack.title)
        setCurrentVideo(firstTrack)
        setQueue(allTracks.slice(1))
        setPreviousTracks([])
        setIsPlaying(true)
        return
      }

      console.log("[v0] ✗ No more songs in queue, playback stopped")
      console.log("[v0] TIP: Add songs to queue to enable continuous playback")
      setIsPlaying(false)
    }
    console.log("[v0] ===== PLAY NEXT COMPLETED =====")
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

  const removeFromQueue = (index: number) => {
    console.log("[v0] Removing from queue at index:", index)
    setQueue((prev) => prev.filter((_, i) => i !== index))
  }

  const reorderQueue = (fromIndex: number, toIndex: number) => {
    console.log("[v0] Reordering queue from", fromIndex, "to", toIndex)
    setQueue((prev) => {
      const newQueue = [...prev]
      const [removed] = newQueue.splice(fromIndex, 1)
      newQueue.splice(toIndex, 0, removed)
      return newQueue
    })
  }

  const shuffleQueue = () => {
    console.log("[v0] Shuffling queue")
    setQueue((prev) => {
      const shuffled = [...prev]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      return shuffled
    })
  }

  const seekTo = (time: number) => {
    console.log("[v0] Seeking to:", time, "seconds")
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
      console.log("[v0] Audio element seeked to:", time)
    } else if (playerRef.current && playerRef.current.seekTo) {
      playerRef.current.seekTo(time, true)
      setCurrentTime(time)
      console.log("[v0] YouTube player seeked to:", time)
    }
  }

  const playVideo = (video: YouTubeVideo, queueVideos?: YouTubeVideo[]) => {
    console.log("[v0] Playing video:", video.title)
    if (queueVideos) {
      console.log("[v0] Setting queue with", queueVideos.length, "videos")
      setQueue(queueVideos)
    }
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
        videoMode,
        toggleVideoMode,
        playVideo,
        togglePlay,
        playNext,
        playPrevious,
        addToQueue,
        clearQueue,
        removeFromQueue,
        reorderQueue,
        shuffleQueue,
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
