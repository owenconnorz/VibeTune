const DB_NAME = "opentune_downloads"
const DB_VERSION = 1
const STORE_NAME = "audio_files"

export interface DownloadedSong {
  id: string
  title: string
  artist: string
  thumbnail: string
  audioBlob: Blob
  duration: string | number
  downloadedAt: number
  size: number
}

let db: IDBDatabase | null = null

async function openDB(): Promise<IDBDatabase> {
  if (db) return db

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: "id" })
        objectStore.createIndex("downloadedAt", "downloadedAt", { unique: false })
      }
    }
  })
}

export async function downloadSong(
  id: string,
  title: string,
  artist: string,
  thumbnail: string,
  duration: string | number,
): Promise<boolean> {
  try {
    console.log("[v0] Downloading song for offline playback:", title)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    try {
      console.log("[v0] Fetching audio stream from API...")
      const response = await fetch(`/api/video/${id}/stream`, {
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        console.error("[v0] API response not OK:", response.status, response.statusText)
        return false
      }

      const data = await response.json()
      console.log("[v0] API response data:", data)

      if (!data.audioUrl) {
        console.error("[v0] No audio URL available in response")
        return false
      }

      console.log("[v0] Fetching audio file from:", data.audioUrl)
      const audioController = new AbortController()
      const audioTimeoutId = setTimeout(() => audioController.abort(), 60000) // 60 second timeout for audio

      const audioResponse = await fetch(data.audioUrl, {
        signal: audioController.signal,
      })

      clearTimeout(audioTimeoutId)

      if (!audioResponse.ok) {
        console.error("[v0] Audio fetch failed:", audioResponse.status, audioResponse.statusText)
        return false
      }

      const audioBlob = await audioResponse.blob()

      console.log("[v0] Audio blob size:", audioBlob.size, "bytes")
      console.log("[v0] Audio blob type:", audioBlob.type)

      if (audioBlob.size === 0) {
        console.error("[v0] Audio blob is empty")
        return false
      }

      // Store in IndexedDB
      console.log("[v0] Opening IndexedDB...")
      const database = await openDB()
      const transaction = database.transaction([STORE_NAME], "readwrite")
      const store = transaction.objectStore(STORE_NAME)

      const downloadedSong: DownloadedSong = {
        id,
        title,
        artist,
        thumbnail,
        audioBlob,
        duration,
        downloadedAt: Date.now(),
        size: audioBlob.size,
      }

      console.log("[v0] Storing song in IndexedDB...")
      await new Promise((resolve, reject) => {
        const request = store.put(downloadedSong)
        request.onsuccess = () => {
          console.log("[v0] IndexedDB store success")
          resolve(request.result)
        }
        request.onerror = () => {
          console.error("[v0] IndexedDB store error:", request.error)
          reject(request.error)
        }
      })

      // Trigger browser download to device
      console.log("[v0] Triggering browser download to device...")
      const url = URL.createObjectURL(audioBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${title} - ${artist}.mp3`
      link.style.display = "none"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      console.log("[v0] Browser download triggered")

      console.log("[v0] Song downloaded successfully:", title)
      return true
    } catch (error) {
      clearTimeout(timeoutId)
      if (error instanceof Error && error.name === "AbortError") {
        console.error("[v0] Download timeout:", title)
        return false
      }
      throw error
    }
  } catch (error) {
    console.error("[v0] Error downloading song:", error)
    if (error instanceof Error) {
      console.error("[v0] Error message:", error.message)
      console.error("[v0] Error stack:", error.stack)
    }
    return false
  }
}

export async function getDownloadedSong(id: string): Promise<DownloadedSong | null> {
  try {
    const database = await openDB()
    const transaction = database.transaction([STORE_NAME], "readonly")
    const store = transaction.objectStore(STORE_NAME)

    return new Promise((resolve, reject) => {
      const request = store.get(id)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error("[v0] Error getting downloaded song:", error)
    return null
  }
}

export async function getAllDownloadedSongs(): Promise<DownloadedSong[]> {
  try {
    const database = await openDB()
    const transaction = database.transaction([STORE_NAME], "readonly")
    const store = transaction.objectStore(STORE_NAME)

    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error("[v0] Error getting all downloaded songs:", error)
    return []
  }
}

export async function isDownloaded(id: string): Promise<boolean> {
  const song = await getDownloadedSong(id)
  return song !== null
}

export async function deleteSong(id: string): Promise<boolean> {
  try {
    const database = await openDB()
    const transaction = database.transaction([STORE_NAME], "readwrite")
    const store = transaction.objectStore(STORE_NAME)

    await new Promise((resolve, reject) => {
      const request = store.delete(id)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    console.log("[v0] Song deleted from offline storage:", id)
    return true
  } catch (error) {
    console.error("[v0] Error deleting song:", error)
    return false
  }
}

export async function getTotalStorageSize(): Promise<number> {
  const songs = await getAllDownloadedSongs()
  return songs.reduce((total, song) => total + song.size, 0)
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
}
