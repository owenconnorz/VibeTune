"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Clock, X } from "lucide-react"
import { sleepTimerStorage } from "@/lib/sleep-timer-storage"
import { useMusicPlayer } from "@/components/music-player-provider"

interface SleepTimerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const TIMER_OPTIONS = [
  { label: "15 minutes", value: 15 },
  { label: "30 minutes", value: 30 },
  { label: "45 minutes", value: 45 },
  { label: "1 hour", value: 60 },
  { label: "1.5 hours", value: 90 },
  { label: "2 hours", value: 120 },
]

export function SleepTimerDialog({ open, onOpenChange }: SleepTimerDialogProps) {
  const { togglePlay, isPlaying } = useMusicPlayer()
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    const updateTimer = () => {
      const remaining = sleepTimerStorage.getRemainingTime()
      setRemainingSeconds(remaining)
      setIsActive(remaining > 0)

      if (remaining === 0 && isActive && isPlaying) {
        togglePlay()
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    const handleTimerChange = () => {
      updateTimer()
    }

    window.addEventListener("sleepTimerChanged", handleTimerChange)

    return () => {
      clearInterval(interval)
      window.removeEventListener("sleepTimerChanged", handleTimerChange)
    }
  }, [isActive, isPlaying, togglePlay])

  const handleSetTimer = (minutes: number) => {
    sleepTimerStorage.setTimer(minutes)
    onOpenChange(false)
  }

  const handleCancelTimer = () => {
    sleepTimerStorage.clearTimer()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Sleep Timer
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isActive ? (
            <div className="text-center space-y-4">
              <div className="p-6 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm text-muted-foreground mb-2">Music will stop in</p>
                <p className="text-4xl font-bold text-primary">{formatTime(remainingSeconds)}</p>
              </div>
              <Button variant="outline" onClick={handleCancelTimer} className="w-full bg-transparent">
                <X className="w-4 h-4 mr-2" />
                Cancel Timer
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {TIMER_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant="outline"
                  onClick={() => handleSetTimer(option.value)}
                  className="h-auto py-4 flex flex-col items-center gap-1"
                >
                  <Clock className="w-5 h-5" />
                  <span className="text-sm font-medium">{option.label}</span>
                </Button>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center">
            Playback will automatically pause when the timer ends
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
