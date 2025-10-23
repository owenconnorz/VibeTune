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
    const history = localStorage.getItem("vibetune_history")
    return history ? JSON.parse(history) : []
  },

  addToHistory: (video: Omit<HistoryVideo, "playedAt">) => {
    const history = historyStorage.getHistory()
    const filtered = history.filter((v) => v.id !== video.id)
    const updated = [{ ...video, playedAt: Date.now() }, ...filtered]
    const trimmed = updated.slice(0, 100)
    localStorage.setItem("vibetune_history", JSON.stringify(trimmed))

    window.dispatchEvent(new Event("historyUpdated"))

    return trimmed
  },

  clearHistory: () => {
    localStorage.removeItem("vibetune_history")
    window.dispatchEvent(new Event("historyUpdated"))
  },

  removeFromHistory: (videoId: string) => {
    const history = historyStorage.getHistory()
    const updated = history.filter((v) => v.id !== videoId)
    localStorage.setItem("vibetune_history", JSON.stringify(updated))
    window.dispatchEvent(new Event("historyUpdated"))
    return updated
  },
}
