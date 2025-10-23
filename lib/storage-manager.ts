"use client"

// Storage management utilities for caching songs and images

export type CacheSize = "disable" | "128" | "256" | "512" | "1024" | "2048" | "4096" | "8192" | "unlimited"

export interface StorageStats {
  downloadedSongs: number // in MB
  songCache: number // in MB
  imageCache: number // in MB
  maxSongCache: CacheSize
  maxImageCache: CacheSize
}

const STORAGE_KEYS = {
  MAX_SONG_CACHE: "opentune_max_song_cache",
  MAX_IMAGE_CACHE: "opentune_max_image_cache",
  DOWNLOADED_SONGS: "opentune_downloaded_songs",
  SONG_CACHE: "opentune_song_cache",
  IMAGE_CACHE: "opentune_image_cache",
}

export function getStorageStats(): StorageStats {
  if (typeof window === "undefined") {
    return {
      downloadedSongs: 0,
      songCache: 0,
      imageCache: 0,
      maxSongCache: "unlimited",
      maxImageCache: "8192",
    }
  }

  return {
    downloadedSongs: Number.parseFloat(localStorage.getItem(STORAGE_KEYS.DOWNLOADED_SONGS) || "474"),
    songCache: Number.parseFloat(localStorage.getItem(STORAGE_KEYS.SONG_CACHE) || "680"),
    imageCache: Number.parseFloat(localStorage.getItem(STORAGE_KEYS.IMAGE_CACHE) || "44"),
    maxSongCache: (localStorage.getItem(STORAGE_KEYS.MAX_SONG_CACHE) as CacheSize) || "unlimited",
    maxImageCache: (localStorage.getItem(STORAGE_KEYS.MAX_IMAGE_CACHE) as CacheSize) || "8192",
  }
}

export function setMaxSongCache(size: CacheSize) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.MAX_SONG_CACHE, size)
  }
}

export function setMaxImageCache(size: CacheSize) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.MAX_IMAGE_CACHE, size)
  }
}

export function clearDownloads() {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.DOWNLOADED_SONGS, "0")
  }
}

export function clearSongCache() {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.SONG_CACHE, "0")
  }
}

export function clearImageCache() {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEYS.IMAGE_CACHE, "0")
  }
}

export function formatCacheSize(size: CacheSize): string {
  if (size === "disable") return "Disable"
  if (size === "unlimited") return "Unlimited"
  const sizeNum = Number.parseInt(size)
  if (sizeNum >= 1024) {
    return `${sizeNum / 1024} GB`
  }
  return `${sizeNum} MB`
}

export function getCacheSizeInMB(size: CacheSize): number {
  if (size === "disable") return 0
  if (size === "unlimited") return Number.POSITIVE_INFINITY
  return Number.parseInt(size)
}
