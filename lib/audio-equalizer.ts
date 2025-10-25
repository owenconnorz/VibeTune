export interface EqualizerBand {
  frequency: number
  gain: number
  type: BiquadFilterType
  Q: number
}

export interface EqualizerPreset {
  name: string
  gains: number[] // 10 bands
}

export const EQUALIZER_BANDS: Omit<EqualizerBand, "gain">[] = [
  { frequency: 32, type: "lowshelf", Q: 1 },
  { frequency: 64, type: "peaking", Q: 1 },
  { frequency: 125, type: "peaking", Q: 1 },
  { frequency: 250, type: "peaking", Q: 1 },
  { frequency: 500, type: "peaking", Q: 1 },
  { frequency: 1000, type: "peaking", Q: 1 },
  { frequency: 2000, type: "peaking", Q: 1 },
  { frequency: 4000, type: "peaking", Q: 1 },
  { frequency: 8000, type: "peaking", Q: 1 },
  { frequency: 16000, type: "highshelf", Q: 1 },
]

export const EQUALIZER_PRESETS: EqualizerPreset[] = [
  { name: "Flat", gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { name: "Rock", gains: [5, 3, -2, -3, -1, 1, 3, 4, 4, 4] },
  { name: "Pop", gains: [-1, -1, 0, 2, 4, 4, 2, 0, -1, -1] },
  { name: "Jazz", gains: [4, 3, 1, 2, -1, -1, 0, 1, 3, 4] },
  { name: "Classical", gains: [5, 4, 3, 2, -1, -1, 0, 2, 3, 4] },
  { name: "Bass Boost", gains: [8, 6, 4, 2, 0, 0, 0, 0, 0, 0] },
  { name: "Treble Boost", gains: [0, 0, 0, 0, 0, 0, 2, 4, 6, 8] },
  { name: "Vocal Boost", gains: [-2, -2, -1, 1, 3, 4, 3, 1, -1, -2] },
  { name: "Electronic", gains: [5, 4, 1, 0, -2, 2, 1, 2, 4, 5] },
  { name: "Hip Hop", gains: [6, 4, 1, 3, -1, -1, 1, -1, 2, 3] },
]

export class AudioEqualizer {
  private audioContext: AudioContext | null = null
  private sourceNode: MediaElementAudioSourceNode | null = null
  private filters: BiquadFilterNode[] = []
  private gainNode: GainNode | null = null
  private audioElement: HTMLAudioElement | null = null
  private isInitialized = false

  initialize(audioElement: HTMLAudioElement) {
    if (this.isInitialized && this.audioElement === audioElement) {
      return
    }

    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      // Create source node from audio element
      this.sourceNode = this.audioContext.createMediaElementSource(audioElement)

      // Create gain node for volume control
      this.gainNode = this.audioContext.createGain()

      // Create filter nodes for each band
      this.filters = EQUALIZER_BANDS.map((band) => {
        const filter = this.audioContext!.createBiquadFilter()
        filter.type = band.type
        filter.frequency.value = band.frequency
        filter.Q.value = band.Q
        filter.gain.value = 0
        return filter
      })

      // Connect nodes: source -> filters -> gain -> destination
      let previousNode: AudioNode = this.sourceNode

      for (const filter of this.filters) {
        previousNode.connect(filter)
        previousNode = filter
      }

      previousNode.connect(this.gainNode)
      this.gainNode.connect(this.audioContext.destination)

      this.audioElement = audioElement
      this.isInitialized = true

      console.log("[v0] Audio equalizer initialized with", this.filters.length, "bands")
    } catch (error) {
      console.error("[v0] Error initializing audio equalizer:", error)
    }
  }

  setGain(bandIndex: number, gain: number) {
    if (!this.isInitialized || bandIndex < 0 || bandIndex >= this.filters.length) {
      return
    }

    this.filters[bandIndex].gain.value = gain
    console.log(`[v0] EQ Band ${bandIndex} (${EQUALIZER_BANDS[bandIndex].frequency}Hz) set to ${gain}dB`)
  }

  setAllGains(gains: number[]) {
    if (!this.isInitialized) {
      return
    }

    gains.forEach((gain, index) => {
      if (index < this.filters.length) {
        this.filters[index].gain.value = gain
      }
    })

    console.log("[v0] Applied EQ preset with gains:", gains)
  }

  setEnabled(enabled: boolean) {
    if (!this.isInitialized) {
      return
    }

    if (enabled) {
      // Equalizer is always connected, just set gains to 0 to disable
      console.log("[v0] Equalizer enabled")
    } else {
      // Set all gains to 0 to effectively disable
      this.filters.forEach((filter) => {
        filter.gain.value = 0
      })
      console.log("[v0] Equalizer disabled (all gains set to 0)")
    }
  }

  reset() {
    this.setAllGains([0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
  }

  disconnect() {
    if (!this.isInitialized) {
      return
    }

    try {
      this.sourceNode?.disconnect()
      this.filters.forEach((filter) => filter.disconnect())
      this.gainNode?.disconnect()
      this.audioContext?.close()

      this.isInitialized = false
      console.log("[v0] Audio equalizer disconnected")
    } catch (error) {
      console.error("[v0] Error disconnecting equalizer:", error)
    }
  }
}

// Singleton instance
export const audioEqualizer = new AudioEqualizer()
