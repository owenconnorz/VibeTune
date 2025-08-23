import {
  type AudioFormat,
  type VideoFormat,
  AudioQualityLevel,
  NetworkType,
  type YouTubeAPISettings,
} from "./youtube-api-advanced"

export interface StreamSelectionOptions {
  targetVideoQuality?: number // 144, 480, 720, 1080
  networkType: NetworkType
  settings: YouTubeAPISettings
}

export interface SelectedStreams {
  audio: AudioFormat | null
  video: VideoFormat | null
  merged: boolean
  quality: {
    audio: AudioQualityLevel
    video: number | null
  }
}

export class StreamSelector {
  private settings: YouTubeAPISettings

  constructor(settings: YouTubeAPISettings) {
    this.settings = settings
  }

  selectBestAudioFormat(formats: AudioFormat[], networkType: NetworkType): AudioFormat | null {
    if (formats.length === 0) return null

    console.log(`[v0] Selecting audio from ${formats.length} formats, network: ${networkType}`)

    // Determine target quality based on network and settings
    const targetQuality = this.getTargetAudioQuality(networkType)
    const qualityRange = this.getQualityRange(targetQuality)

    // Filter by format preference (Opus vs AAC)
    const opusFormats = formats.filter((f) => f.mimeType.includes("opus") || f.mimeType.includes("webm"))
    const aacFormats = formats.filter((f) => f.mimeType.includes("aac") || f.mimeType.includes("mp4"))

    console.log(`[v0] Found ${opusFormats.length} Opus and ${aacFormats.length} AAC formats`)

    // Choose preferred format type
    const preferredFormats =
      this.settings.preferOpus && opusFormats.length > 0 ? opusFormats : aacFormats.length > 0 ? aacFormats : formats

    // Filter by quality requirements
    const qualityFiltered = preferredFormats.filter(
      (f) => f.bitrate >= qualityRange.min && f.bitrate <= qualityRange.max,
    )

    const finalFormats = qualityFiltered.length > 0 ? qualityFiltered : preferredFormats

    // Sort by bitrate and select best within range
    const sorted = finalFormats.sort((a, b) => {
      // Prefer higher bitrate within quality range
      if (this.settings.highQualityAudio) {
        return b.bitrate - a.bitrate
      }
      // For lower quality settings, prefer formats closer to target
      const targetBitrate = qualityRange.max / 2
      const aDiff = Math.abs(a.bitrate - targetBitrate)
      const bDiff = Math.abs(b.bitrate - targetBitrate)
      return aDiff - bDiff
    })

    const selected = sorted[0]
    console.log(`[v0] Selected audio: ${selected?.mimeType} at ${selected?.bitrate}bps`)

    return selected
  }

  selectBestVideoFormat(formats: VideoFormat[], targetQuality?: number): VideoFormat | null {
    if (formats.length === 0 || !this.settings.showVideos) return null

    console.log(`[v0] Selecting video from ${formats.length} formats, target: ${targetQuality || "auto"}`)

    let filtered = formats

    // Filter by target resolution if specified
    if (targetQuality) {
      filtered = formats.filter((f) => {
        if (!f.height) return true

        switch (targetQuality) {
          case 144:
            return f.height <= 180 // Allow some tolerance
          case 480:
            return f.height <= 540 && f.height > 240
          case 720:
            return f.height <= 800 && f.height > 540
          case 1080:
            return f.height <= 1200 && f.height > 800
          default:
            return true
        }
      })

      if (filtered.length === 0) {
        console.log(`[v0] No formats match ${targetQuality}p, using all formats`)
        filtered = formats
      }
    }

    // Sort by quality preference
    const sorted = filtered.sort((a, b) => {
      // Prefer MP4 over WebM for compatibility
      if (a.mimeType.includes("mp4") && !b.mimeType.includes("mp4")) return -1
      if (!a.mimeType.includes("mp4") && b.mimeType.includes("mp4")) return 1

      // Then by bitrate
      return b.bitrate - a.bitrate
    })

    const selected = sorted[0]
    console.log(`[v0] Selected video: ${selected?.height}p ${selected?.mimeType} at ${selected?.bitrate}bps`)

    return selected
  }

  selectOptimalStreams(
    audioFormats: AudioFormat[],
    videoFormats: VideoFormat[],
    options: StreamSelectionOptions,
  ): SelectedStreams {
    console.log(`[v0] Selecting optimal streams - Audio: ${audioFormats.length}, Video: ${videoFormats.length}`)

    const audio = this.selectBestAudioFormat(audioFormats, options.networkType)
    const video = this.selectBestVideoFormat(videoFormats, options.targetVideoQuality)

    // Determine if streams should be merged
    const shouldMerge = this.settings.preferVideos && this.settings.showVideos && audio && video

    const result: SelectedStreams = {
      audio,
      video: shouldMerge ? video : null,
      merged: shouldMerge || false,
      quality: {
        audio: this.getTargetAudioQuality(options.networkType),
        video: video?.height || null,
      },
    }

    console.log(`[v0] Stream selection result:`, {
      hasAudio: !!result.audio,
      hasVideo: !!result.video,
      merged: result.merged,
      audioQuality: result.quality.audio,
      videoQuality: result.quality.video,
    })

    return result
  }

  private getTargetAudioQuality(networkType: NetworkType): AudioQualityLevel {
    if (!this.settings.adaptiveAudio) {
      return this.settings.highQualityAudio ? AudioQualityLevel.HIGH : AudioQualityLevel.MEDIUM
    }

    switch (networkType) {
      case NetworkType.RESTRICTED_WIFI:
        return AudioQualityLevel.LOW
      case NetworkType.MOBILE_DATA:
        return AudioQualityLevel.MEDIUM
      case NetworkType.WIFI:
        return this.settings.highQualityAudio ? AudioQualityLevel.VERY_HIGH : AudioQualityLevel.HIGH
      default:
        return AudioQualityLevel.MEDIUM
    }
  }

  private getQualityRange(level: AudioQualityLevel): { min: number; max: number } {
    switch (level) {
      case AudioQualityLevel.LOW:
        return { min: 0, max: 64000 }
      case AudioQualityLevel.MEDIUM:
        return { min: 48000, max: 128000 }
      case AudioQualityLevel.HIGH:
        return { min: 128000, max: 256000 }
      case AudioQualityLevel.VERY_HIGH:
        return { min: 192000, max: Number.MAX_SAFE_INTEGER }
    }
  }

  updateSettings(newSettings: Partial<YouTubeAPISettings>): void {
    this.settings = { ...this.settings, ...newSettings }
    console.log(`[v0] Stream selector settings updated:`, this.settings)
  }

  getQualityRecommendations(networkType: NetworkType): {
    audio: AudioQualityLevel
    video: number
    adaptive: boolean
  } {
    const audioQuality = this.getTargetAudioQuality(networkType)

    let videoQuality: number
    switch (networkType) {
      case NetworkType.RESTRICTED_WIFI:
        videoQuality = 144
        break
      case NetworkType.MOBILE_DATA:
        videoQuality = 480
        break
      case NetworkType.WIFI:
        videoQuality = this.settings.highQualityAudio ? 720 : 480
        break
      default:
        videoQuality = 480
    }

    return {
      audio: audioQuality,
      video: videoQuality,
      adaptive: this.settings.adaptiveAudio,
    }
  }
}

export function createStreamSelector(settings: YouTubeAPISettings): StreamSelector {
  return new StreamSelector(settings)
}
