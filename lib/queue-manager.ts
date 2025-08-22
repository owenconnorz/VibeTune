import type { Track } from "@/contexts/audio-player-context"

export interface QueueState {
  tracks: Track[]
  currentIndex: number
  history: Track[]
  upcoming: Track[]
  originalOrder: Track[]
  shuffleEnabled: boolean
  repeatMode: "none" | "one" | "all"
}

export class QueueManager {
  private state: QueueState
  private listeners: Set<(state: QueueState) => void> = new Set()

  constructor() {
    this.state = {
      tracks: [],
      currentIndex: -1,
      history: [],
      upcoming: [],
      originalOrder: [],
      shuffleEnabled: false,
      repeatMode: "none",
    }
  }

  subscribe(listener: (state: QueueState) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.state))
  }

  setQueue(tracks: Track[], startIndex = 0) {
    this.state.tracks = [...tracks]
    this.state.originalOrder = [...tracks]
    this.state.currentIndex = Math.max(0, Math.min(startIndex, tracks.length - 1))
    this.state.history = []
    this.updateUpcoming()

    if (this.state.shuffleEnabled) {
      this.applyShuffle()
    }

    this.notify()
    console.log("[v0] Queue set with", tracks.length, "tracks, starting at index", this.state.currentIndex)
  }

  applyShuffle() {
    if (this.state.tracks.length <= 1) return

    const currentTrack = this.state.tracks[this.state.currentIndex]
    const otherTracks = this.state.tracks.filter((_, index) => index !== this.state.currentIndex)

    // Fisher-Yates shuffle with bias towards variety
    for (let i = otherTracks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[otherTracks[i], otherTracks[j]] = [otherTracks[j], otherTracks[i]]
    }

    this.state.tracks = [currentTrack, ...otherTracks]
    this.state.currentIndex = 0
    this.updateUpcoming()
    this.notify()
  }

  toggleShuffle() {
    this.state.shuffleEnabled = !this.state.shuffleEnabled

    if (this.state.shuffleEnabled) {
      this.applyShuffle()
    } else {
      // Restore original order while keeping current track
      const currentTrack = this.getCurrentTrack()
      this.state.tracks = [...this.state.originalOrder]
      this.state.currentIndex = currentTrack ? this.state.tracks.findIndex((t) => t.id === currentTrack.id) : 0
      this.updateUpcoming()
    }

    this.notify()
    console.log("[v0] Shuffle toggled:", this.state.shuffleEnabled)
  }

  setRepeatMode(mode: "none" | "one" | "all") {
    this.state.repeatMode = mode
    this.updateUpcoming()
    this.notify()
    console.log("[v0] Repeat mode set to:", mode)
  }

  nextTrack(): { track: Track | null; shouldCrossfade: boolean } {
    const currentTrack = this.getCurrentTrack()

    if (this.state.repeatMode === "one" && currentTrack) {
      return { track: currentTrack, shouldCrossfade: false }
    }

    if (currentTrack) {
      this.state.history.push(currentTrack)
      // Keep history manageable
      if (this.state.history.length > 50) {
        this.state.history = this.state.history.slice(-25)
      }
    }

    if (this.state.currentIndex < this.state.tracks.length - 1) {
      this.state.currentIndex++
    } else if (this.state.repeatMode === "all") {
      this.state.currentIndex = 0
    } else {
      this.notify()
      return { track: null, shouldCrossfade: false }
    }

    const nextTrack = this.getCurrentTrack()
    this.updateUpcoming()
    this.notify()

    return {
      track: nextTrack,
      shouldCrossfade: this.shouldCrossfade(currentTrack, nextTrack),
    }
  }

  previousTrack(): Track | null {
    if (this.state.history.length > 0) {
      // Go back in history
      const previousTrack = this.state.history.pop()!
      const currentTrack = this.getCurrentTrack()

      if (currentTrack) {
        // Find the previous track in the current queue
        const prevIndex = this.state.tracks.findIndex((t) => t.id === previousTrack.id)
        if (prevIndex !== -1) {
          this.state.currentIndex = prevIndex
        }
      }

      this.updateUpcoming()
      this.notify()
      return previousTrack
    }

    if (this.state.currentIndex > 0) {
      this.state.currentIndex--
      const prevTrack = this.getCurrentTrack()
      this.updateUpcoming()
      this.notify()
      return prevTrack
    } else if (this.state.repeatMode === "all") {
      this.state.currentIndex = this.state.tracks.length - 1
      const lastTrack = this.getCurrentTrack()
      this.updateUpcoming()
      this.notify()
      return lastTrack
    }

    return null
  }

  insertTrack(track: Track, position: "next" | "end" | number = "end") {
    let insertIndex: number

    if (position === "next") {
      insertIndex = this.state.currentIndex + 1
    } else if (position === "end") {
      insertIndex = this.state.tracks.length
    } else {
      insertIndex = Math.max(0, Math.min(position, this.state.tracks.length))
    }

    this.state.tracks.splice(insertIndex, 0, track)

    // Adjust current index if needed
    if (insertIndex <= this.state.currentIndex) {
      this.state.currentIndex++
    }

    this.updateUpcoming()
    this.notify()
    console.log("[v0] Track inserted at position", insertIndex)
  }

  removeTrack(trackId: string) {
    const trackIndex = this.state.tracks.findIndex((t) => t.id === trackId)
    if (trackIndex === -1) return

    this.state.tracks.splice(trackIndex, 1)

    // Adjust current index
    if (trackIndex < this.state.currentIndex) {
      this.state.currentIndex--
    } else if (trackIndex === this.state.currentIndex) {
      // Current track was removed, stay at same index (next track)
      if (this.state.currentIndex >= this.state.tracks.length) {
        this.state.currentIndex = Math.max(0, this.state.tracks.length - 1)
      }
    }

    this.updateUpcoming()
    this.notify()
    console.log("[v0] Track removed from queue")
  }

  moveTrack(fromIndex: number, toIndex: number) {
    if (fromIndex < 0 || fromIndex >= this.state.tracks.length || toIndex < 0 || toIndex >= this.state.tracks.length) {
      return
    }

    const track = this.state.tracks.splice(fromIndex, 1)[0]
    this.state.tracks.splice(toIndex, 0, track)

    // Adjust current index
    if (fromIndex === this.state.currentIndex) {
      this.state.currentIndex = toIndex
    } else if (fromIndex < this.state.currentIndex && toIndex >= this.state.currentIndex) {
      this.state.currentIndex--
    } else if (fromIndex > this.state.currentIndex && toIndex <= this.state.currentIndex) {
      this.state.currentIndex++
    }

    this.updateUpcoming()
    this.notify()
    console.log("[v0] Track moved from", fromIndex, "to", toIndex)
  }

  getCurrentTrack(): Track | null {
    return this.state.tracks[this.state.currentIndex] || null
  }

  getState(): QueueState {
    return { ...this.state }
  }

  private updateUpcoming() {
    const upcoming: Track[] = []
    const maxUpcoming = 10

    for (let i = 1; i <= maxUpcoming; i++) {
      let nextIndex = this.state.currentIndex + i

      if (nextIndex >= this.state.tracks.length) {
        if (this.state.repeatMode === "all") {
          nextIndex = nextIndex % this.state.tracks.length
        } else {
          break
        }
      }

      const track = this.state.tracks[nextIndex]
      if (track && !upcoming.find((t) => t.id === track.id)) {
        upcoming.push(track)
      }
    }

    this.state.upcoming = upcoming
  }

  private shouldCrossfade(currentTrack: Track | null, nextTrack: Track | null): boolean {
    if (!currentTrack || !nextTrack) return false

    // Don't crossfade if tracks are very different genres or one is a video
    if (currentTrack.isVideo || nextTrack.isVideo) return false

    // Simple heuristic: crossfade if both are music tracks
    return true
  }

  clear() {
    this.state = {
      tracks: [],
      currentIndex: -1,
      history: [],
      upcoming: [],
      originalOrder: [],
      shuffleEnabled: false,
      repeatMode: "none",
    }
    this.notify()
    console.log("[v0] Queue cleared")
  }

  saveState() {
    try {
      const stateToSave = {
        tracks: this.state.tracks,
        currentIndex: this.state.currentIndex,
        shuffleEnabled: this.state.shuffleEnabled,
        repeatMode: this.state.repeatMode,
        originalOrder: this.state.originalOrder,
      }
      localStorage.setItem("vibetune-queue-state", JSON.stringify(stateToSave))
      console.log("[v0] Queue state saved")
    } catch (error) {
      console.warn("[v0] Failed to save queue state:", error)
    }
  }

  restoreState(): boolean {
    try {
      const saved = localStorage.getItem("vibetune-queue-state")
      if (!saved) return false

      const state = JSON.parse(saved)
      this.state.tracks = state.tracks || []
      this.state.currentIndex = state.currentIndex || -1
      this.state.shuffleEnabled = state.shuffleEnabled || false
      this.state.repeatMode = state.repeatMode || "none"
      this.state.originalOrder = state.originalOrder || []

      this.updateUpcoming()
      this.notify()
      console.log("[v0] Queue state restored")
      return true
    } catch (error) {
      console.warn("[v0] Failed to restore queue state:", error)
      return false
    }
  }
}

export const queueManager = new QueueManager()
