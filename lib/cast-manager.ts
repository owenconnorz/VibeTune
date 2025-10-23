export class CastManager {
  private static instance: CastManager
  private castContext: any = null
  private castSession: any = null
  private remotePlayer: any = null
  private remotePlayerController: any = null
  private listeners: Set<(state: CastState) => void> = new Set()

  private constructor() {}

  static getInstance(): CastManager {
    if (!CastManager.instance) {
      CastManager.instance = new CastManager()
    }
    return CastManager.instance
  }

  initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined") {
        reject(new Error("Cast API only available in browser"))
        return
      }

      // Check if Cast API is already loaded
      if ((window as any).chrome?.cast) {
        this.setupCastContext()
        resolve()
        return
      }

      // Wait for Cast API to load
      const checkInterval = setInterval(() => {
        if ((window as any).chrome?.cast) {
          clearInterval(checkInterval)
          this.setupCastContext()
          resolve()
        }
      }, 100)

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval)
        reject(new Error("Cast API failed to load"))
      }, 10000)
    })
  }

  private setupCastContext() {
    try {
      const cast = (window as any).chrome.cast
      this.castContext = cast.framework.CastContext.getInstance()

      this.castContext.setOptions({
        receiverApplicationId: cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
        autoJoinPolicy: cast.AutoJoinPolicy.ORIGIN_SCOPED,
      })

      this.remotePlayer = new cast.framework.RemotePlayer()
      this.remotePlayerController = new cast.framework.RemotePlayerController(this.remotePlayer)

      // Listen for session state changes
      this.castContext.addEventListener(cast.framework.CastContextEventType.SESSION_STATE_CHANGED, (event: any) => {
        this.handleSessionStateChanged(event)
      })

      // Listen for remote player changes
      this.remotePlayerController.addEventListener(cast.framework.RemotePlayerEventType.ANY_CHANGE, () => {
        this.notifyListeners()
      })

      console.log("[v0] Cast context initialized")
    } catch (error) {
      console.error("[v0] Error setting up cast context:", error)
    }
  }

  private handleSessionStateChanged(event: any) {
    const cast = (window as any).chrome.cast
    const sessionState = event.sessionState

    if (sessionState === cast.framework.SessionState.SESSION_STARTED) {
      this.castSession = this.castContext.getCurrentSession()
      console.log("[v0] Cast session started")
    } else if (sessionState === cast.framework.SessionState.SESSION_ENDED) {
      this.castSession = null
      console.log("[v0] Cast session ended")
    }

    this.notifyListeners()
  }

  requestSession(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.castContext) {
        reject(new Error("Cast context not initialized"))
        return
      }

      this.castContext
        .requestSession()
        .then(() => {
          console.log("[v0] Cast session requested successfully")
          resolve()
        })
        .catch((error: any) => {
          console.error("[v0] Error requesting cast session:", error)
          reject(error)
        })
    })
  }

  endSession() {
    if (this.castSession) {
      this.castSession.endSession(true)
    }
  }

  loadMedia(videoId: string, title: string, artist: string, thumbnail: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.castSession) {
        reject(new Error("No active cast session"))
        return
      }

      const cast = (window as any).chrome.cast
      const mediaInfo = new cast.media.MediaInfo(`https://www.youtube.com/watch?v=${videoId}`, "video/mp4")

      mediaInfo.metadata = new cast.media.MusicTrackMediaMetadata()
      mediaInfo.metadata.title = title
      mediaInfo.metadata.artist = artist
      mediaInfo.metadata.images = [new cast.Image(thumbnail)]

      const request = new cast.media.LoadRequest(mediaInfo)

      this.castSession
        .loadMedia(request)
        .then(() => {
          console.log("[v0] Media loaded on cast device")
          resolve()
        })
        .catch((error: any) => {
          console.error("[v0] Error loading media:", error)
          reject(error)
        })
    })
  }

  play() {
    if (this.remotePlayerController && this.remotePlayer.isPaused) {
      this.remotePlayerController.playOrPause()
    }
  }

  pause() {
    if (this.remotePlayerController && !this.remotePlayer.isPaused) {
      this.remotePlayerController.playOrPause()
    }
  }

  seek(time: number) {
    if (this.remotePlayer) {
      this.remotePlayer.currentTime = time
      this.remotePlayerController.seek()
    }
  }

  setVolume(volume: number) {
    if (this.remotePlayer) {
      this.remotePlayer.volumeLevel = volume
      this.remotePlayerController.setVolumeLevel()
    }
  }

  getState(): CastState {
    return {
      isConnected: !!this.castSession,
      isPlaying: this.remotePlayer?.isPaused === false,
      currentTime: this.remotePlayer?.currentTime || 0,
      duration: this.remotePlayer?.duration || 0,
      volume: this.remotePlayer?.volumeLevel || 1,
      deviceName: this.castSession?.getCastDevice()?.friendlyName || null,
    }
  }

  subscribe(listener: (state: CastState) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notifyListeners() {
    const state = this.getState()
    this.listeners.forEach((listener) => listener(state))
  }
}

export interface CastState {
  isConnected: boolean
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  deviceName: string | null
}
