export interface HistoryVideo {
  id: string
  title: string
  thumbnail: string
  channelTitle: string
  duration: string
  playedAt: number
}

export const historyStorage = {
  getHistory: (): HistoryVideo[] => {
    if (typeof window === "undefined") return []
    const history = localStorage.getItem("opentune_history")
    return history ? JSON.parse(history) : []
  },

  addToHistory: (video: Omit<HistoryVideo, "playedAt">) => {
    const history = historyStorage.getHistory()
    // Remove if already exists
    const filtered = history.filter((v) => v.id !== video.id)
    // Add to beginning with current timestamp
    const updated = [{ ...video, playedAt: Date.now() }, ...filtered]
    // Keep only last 100 videos
    const trimmed = updated.slice(0, 100)
    localStorage.setItem("opentune_history", JSON.stringify(trimmed))
    return trimmed
  },

  clearHistory: () => {
    localStorage.removeItem("opentune_history")
  },

  removeFromHistory: (videoId: string) => {
    const history = historyStorage.getHistory()
    const updated = history.filter((v) => v.id !== videoId)
    localStorage.setItem("opentune_history", JSON.stringify(updated))
    return updated
  },
}
