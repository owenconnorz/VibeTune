const STORAGE_KEY = "vibetune_sleep_timer"

export interface SleepTimerState {
  endTime: number | null
  duration: number | null
}

export const sleepTimerStorage = {
  getState(): SleepTimerState {
    if (typeof window === "undefined") {
      return { endTime: null, duration: null }
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return { endTime: null, duration: null }

      const state = JSON.parse(stored) as SleepTimerState

      // Check if timer has expired
      if (state.endTime && state.endTime < Date.now()) {
        this.clearTimer()
        return { endTime: null, duration: null }
      }

      return state
    } catch {
      return { endTime: null, duration: null }
    }
  },

  setTimer(durationMinutes: number): void {
    if (typeof window === "undefined") return

    const endTime = Date.now() + durationMinutes * 60 * 1000
    const state: SleepTimerState = {
      endTime,
      duration: durationMinutes,
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    window.dispatchEvent(new Event("sleepTimerChanged"))
  },

  clearTimer(): void {
    if (typeof window === "undefined") return

    localStorage.removeItem(STORAGE_KEY)
    window.dispatchEvent(new Event("sleepTimerChanged"))
  },

  getRemainingTime(): number {
    const state = this.getState()
    if (!state.endTime) return 0

    const remaining = Math.max(0, state.endTime - Date.now())
    return Math.ceil(remaining / 1000) // Return seconds
  },
}
