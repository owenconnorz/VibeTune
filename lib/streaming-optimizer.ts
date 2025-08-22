interface StreamQuality {
  bitrate: number
  format: string
  url: string
  size?: number
}

interface NetworkInfo {
  effectiveType: "2g" | "3g" | "4g" | "slow-2g" | "unknown"
  downlink: number
  rtt: number
  saveData: boolean
}

interface CacheEntry {
  url: string
  blob: Blob
  timestamp: number
  quality: StreamQuality
  accessCount: number
}

export class StreamingOptimizer {
  private cache = new Map<string, CacheEntry>()
  private networkInfo: NetworkInfo = {
    effectiveType: "4g",
    downlink: 10,
    rtt: 100,
    saveData: false,
  }
  private maxCacheSize = 100 * 1024 * 1024 // 100MB
  private currentCacheSize = 0
  private preloadQueue: string[] = []
  private isPreloading = false

  constructor() {
    this.initNetworkMonitoring()
    this.startCacheCleanup()
  }

  private initNetworkMonitoring() {
    if ("connection" in navigator) {
      const connection = (navigator as any).connection
      this.updateNetworkInfo(connection)

      connection.addEventListener("change", () => {
        this.updateNetworkInfo(connection)
        console.log("[v0] Network conditions changed:", this.networkInfo)
      })
    }

    // Fallback network detection using fetch timing
    this.performNetworkTest()
    setInterval(() => this.performNetworkTest(), 30000) // Test every 30 seconds
  }

  private updateNetworkInfo(connection: any) {
    this.networkInfo = {
      effectiveType: connection.effectiveType || "4g",
      downlink: connection.downlink || 10,
      rtt: connection.rtt || 100,
      saveData: connection.saveData || false,
    }
  }

  private async performNetworkTest() {
    try {
      const testUrl = "/api/network-test" // Small endpoint for testing
      const startTime = performance.now()

      const response = await fetch(testUrl, {
        method: "HEAD",
        cache: "no-cache",
      })

      const endTime = performance.now()
      const rtt = endTime - startTime

      // Update RTT if we don't have connection API
      if (!("connection" in navigator)) {
        this.networkInfo.rtt = rtt

        // Estimate effective type based on RTT
        if (rtt > 2000) {
          this.networkInfo.effectiveType = "slow-2g"
        } else if (rtt > 1400) {
          this.networkInfo.effectiveType = "2g"
        } else if (rtt > 270) {
          this.networkInfo.effectiveType = "3g"
        } else {
          this.networkInfo.effectiveType = "4g"
        }
      }
    } catch (error) {
      console.warn("[v0] Network test failed:", error)
    }
  }

  selectOptimalQuality(availableQualities: StreamQuality[]): StreamQuality {
    if (availableQualities.length === 0) {
      throw new Error("No stream qualities available")
    }

    // Sort by bitrate (highest first)
    const sortedQualities = [...availableQualities].sort((a, b) => b.bitrate - a.bitrate)

    // If user has data saver enabled, choose lowest quality
    if (this.networkInfo.saveData) {
      console.log("[v0] Data saver enabled, selecting lowest quality")
      return sortedQualities[sortedQualities.length - 1]
    }

    // Select quality based on network conditions
    let targetBitrate: number

    switch (this.networkInfo.effectiveType) {
      case "slow-2g":
        targetBitrate = 64 // 64 kbps
        break
      case "2g":
        targetBitrate = 128 // 128 kbps
        break
      case "3g":
        targetBitrate = 256 // 256 kbps
        break
      case "4g":
      default:
        targetBitrate = 320 // 320 kbps or higher
        break
    }

    // Adjust based on downlink speed
    if (this.networkInfo.downlink < 1) {
      targetBitrate = Math.min(targetBitrate, 128)
    } else if (this.networkInfo.downlink < 2) {
      targetBitrate = Math.min(targetBitrate, 192)
    }

    // Find the best quality that doesn't exceed target bitrate
    const selectedQuality =
      sortedQualities.find((q) => q.bitrate <= targetBitrate) || sortedQualities[sortedQualities.length - 1]

    console.log("[v0] Selected stream quality:", {
      bitrate: selectedQuality.bitrate,
      format: selectedQuality.format,
      networkType: this.networkInfo.effectiveType,
      downlink: this.networkInfo.downlink,
    })

    return selectedQuality
  }

  async getOptimizedStream(trackId: string, availableQualities: StreamQuality[]): Promise<string> {
    const cacheKey = `${trackId}_optimized`
    const cachedEntry = this.cache.get(cacheKey)

    // Return cached stream if available and still valid
    if (cachedEntry && this.isCacheEntryValid(cachedEntry)) {
      cachedEntry.accessCount++
      console.log("[v0] Returning cached stream for:", trackId)
      return URL.createObjectURL(cachedEntry.blob)
    }

    // Select optimal quality
    const optimalQuality = this.selectOptimalQuality(availableQualities)

    try {
      // Fetch and cache the stream
      const response = await fetch(optimalQuality.url)
      if (!response.ok) {
        throw new Error(`Failed to fetch stream: ${response.status}`)
      }

      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)

      // Cache the stream
      await this.cacheStream(cacheKey, blob, optimalQuality)

      console.log("[v0] Stream optimized and cached for:", trackId)
      return blobUrl
    } catch (error) {
      console.error("[v0] Stream optimization failed:", error)
      // Fallback to original URL
      return optimalQuality.url
    }
  }

  private async cacheStream(key: string, blob: Blob, quality: StreamQuality) {
    const entry: CacheEntry = {
      url: key,
      blob,
      timestamp: Date.now(),
      quality,
      accessCount: 1,
    }

    // Check if we need to free up space
    const blobSize = blob.size
    if (this.currentCacheSize + blobSize > this.maxCacheSize) {
      await this.evictLeastUsedEntries(blobSize)
    }

    this.cache.set(key, entry)
    this.currentCacheSize += blobSize

    console.log("[v0] Stream cached:", {
      key,
      size: blobSize,
      totalCacheSize: this.currentCacheSize,
      cacheEntries: this.cache.size,
    })
  }

  private async evictLeastUsedEntries(requiredSpace: number) {
    const entries = Array.from(this.cache.entries())

    // Sort by access count (ascending) and timestamp (oldest first)
    entries.sort((a, b) => {
      if (a[1].accessCount !== b[1].accessCount) {
        return a[1].accessCount - b[1].accessCount
      }
      return a[1].timestamp - b[1].timestamp
    })

    let freedSpace = 0
    const toRemove: string[] = []

    for (const [key, entry] of entries) {
      toRemove.push(key)
      freedSpace += entry.blob.size

      if (freedSpace >= requiredSpace) {
        break
      }
    }

    // Remove entries
    for (const key of toRemove) {
      const entry = this.cache.get(key)
      if (entry) {
        this.currentCacheSize -= entry.blob.size
        this.cache.delete(key)
        URL.revokeObjectURL(entry.url)
      }
    }

    console.log("[v0] Evicted", toRemove.length, "cache entries, freed", freedSpace, "bytes")
  }

  private isCacheEntryValid(entry: CacheEntry): boolean {
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours
    return Date.now() - entry.timestamp < maxAge
  }

  async preloadNextTracks(trackIds: string[], getQualitiesFunc: (id: string) => Promise<StreamQuality[]>) {
    if (this.isPreloading) return

    this.preloadQueue = trackIds.slice(0, 3) // Preload up to 3 tracks
    this.isPreloading = true

    console.log("[v0] Starting preload for", this.preloadQueue.length, "tracks")

    for (const trackId of this.preloadQueue) {
      try {
        const cacheKey = `${trackId}_optimized`

        // Skip if already cached
        if (this.cache.has(cacheKey)) {
          continue
        }

        const qualities = await getQualitiesFunc(trackId)
        if (qualities.length > 0) {
          await this.getOptimizedStream(trackId, qualities)
        }

        // Small delay to avoid overwhelming the network
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (error) {
        console.warn("[v0] Preload failed for track:", trackId, error)
      }
    }

    this.isPreloading = false
    console.log("[v0] Preload completed")
  }

  private startCacheCleanup() {
    setInterval(
      () => {
        this.cleanupExpiredEntries()
      },
      5 * 60 * 1000,
    ) // Every 5 minutes
  }

  private cleanupExpiredEntries() {
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours
    let cleanedCount = 0
    let freedSpace = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > maxAge) {
        freedSpace += entry.blob.size
        this.currentCacheSize -= entry.blob.size
        this.cache.delete(key)
        URL.revokeObjectURL(entry.url)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      console.log("[v0] Cleaned up", cleanedCount, "expired cache entries, freed", freedSpace, "bytes")
    }
  }

  getCacheStats() {
    return {
      entries: this.cache.size,
      totalSize: this.currentCacheSize,
      maxSize: this.maxCacheSize,
      utilizationPercent: (this.currentCacheSize / this.maxCacheSize) * 100,
      networkInfo: this.networkInfo,
    }
  }

  clearCache() {
    for (const [key, entry] of this.cache.entries()) {
      URL.revokeObjectURL(entry.url)
    }

    this.cache.clear()
    this.currentCacheSize = 0
    console.log("[v0] Cache cleared")
  }

  async adjustQualityDuringPlayback(
    trackId: string,
    availableQualities: StreamQuality[],
    currentBufferHealth: number,
  ): Promise<StreamQuality | null> {
    // If buffer is healthy, no need to adjust
    if (currentBufferHealth > 10) {
      return null
    }

    // If buffer is low, try to get a lower quality stream
    const currentQuality = this.selectOptimalQuality(availableQualities)
    const lowerQualities = availableQualities.filter((q) => q.bitrate < currentQuality.bitrate)

    if (lowerQualities.length === 0) {
      return null
    }

    const lowerQuality = lowerQualities[lowerQualities.length - 1] // Lowest available
    console.log("[v0] Adjusting to lower quality due to buffer issues:", {
      from: currentQuality.bitrate,
      to: lowerQuality.bitrate,
      bufferHealth: currentBufferHealth,
    })

    return lowerQuality
  }
}

export const streamingOptimizer = new StreamingOptimizer()
