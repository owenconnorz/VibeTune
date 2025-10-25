"use client"

import { useEffect, useRef, useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Wand2 } from "lucide-react"

interface AudioVisualizerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type VisualizerType = "bars" | "wave" | "circle" | "particles"

export function AudioVisualizer({ open, onOpenChange }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const audioContextRef = useRef<AudioContext>()
  const analyserRef = useRef<AnalyserNode>()
  const dataArrayRef = useRef<Uint8Array>()
  const [visualizerType, setVisualizerType] = useState<VisualizerType>("bars")
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (!open) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      return
    }

    const initAudio = async () => {
      try {
        // Create audio context if it doesn't exist
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext()
          analyserRef.current = audioContextRef.current.createAnalyser()
          analyserRef.current.fftSize = 256

          const bufferLength = analyserRef.current.frequencyBinCount
          dataArrayRef.current = new Uint8Array(bufferLength)

          // Try to connect to audio element
          const audioElement = document.querySelector("audio")
          if (audioElement) {
            const source = audioContextRef.current.createMediaElementSource(audioElement)
            source.connect(analyserRef.current)
            analyserRef.current.connect(audioContextRef.current.destination)
            console.log("[v0] Audio visualizer connected to audio element")
          }
        }

        setIsInitialized(true)
        draw()
      } catch (error) {
        console.error("[v0] Error initializing audio visualizer:", error)
      }
    }

    initAudio()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [open, visualizerType])

  const draw = () => {
    if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const WIDTH = canvas.width
    const HEIGHT = canvas.height

    analyserRef.current.getByteFrequencyData(dataArrayRef.current)

    ctx.fillStyle = "rgb(0, 0, 0)"
    ctx.fillRect(0, 0, WIDTH, HEIGHT)

    switch (visualizerType) {
      case "bars":
        drawBars(ctx, WIDTH, HEIGHT)
        break
      case "wave":
        drawWave(ctx, WIDTH, HEIGHT)
        break
      case "circle":
        drawCircle(ctx, WIDTH, HEIGHT)
        break
      case "particles":
        drawParticles(ctx, WIDTH, HEIGHT)
        break
    }

    animationRef.current = requestAnimationFrame(draw)
  }

  const drawBars = (ctx: CanvasRenderingContext2D, WIDTH: number, HEIGHT: number) => {
    if (!dataArrayRef.current) return

    const bufferLength = dataArrayRef.current.length
    const barWidth = (WIDTH / bufferLength) * 2.5
    let x = 0

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArrayRef.current[i] / 255) * HEIGHT

      const hue = (i / bufferLength) * 360
      ctx.fillStyle = `hsl(${hue}, 100%, 50%)`
      ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight)

      x += barWidth + 1
    }
  }

  const drawWave = (ctx: CanvasRenderingContext2D, WIDTH: number, HEIGHT: number) => {
    if (!dataArrayRef.current) return

    const bufferLength = dataArrayRef.current.length
    const sliceWidth = WIDTH / bufferLength
    let x = 0

    ctx.lineWidth = 2
    ctx.strokeStyle = "rgb(100, 200, 255)"
    ctx.beginPath()

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArrayRef.current[i] / 128.0
      const y = (v * HEIGHT) / 2

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }

      x += sliceWidth
    }

    ctx.lineTo(WIDTH, HEIGHT / 2)
    ctx.stroke()
  }

  const drawCircle = (ctx: CanvasRenderingContext2D, WIDTH: number, HEIGHT: number) => {
    if (!dataArrayRef.current) return

    const bufferLength = dataArrayRef.current.length
    const centerX = WIDTH / 2
    const centerY = HEIGHT / 2
    const radius = Math.min(WIDTH, HEIGHT) / 3

    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
    ctx.strokeStyle = "rgb(100, 200, 255)"
    ctx.lineWidth = 2
    ctx.stroke()

    for (let i = 0; i < bufferLength; i++) {
      const angle = (i / bufferLength) * 2 * Math.PI
      const amplitude = (dataArrayRef.current[i] / 255) * 100

      const x1 = centerX + Math.cos(angle) * radius
      const y1 = centerY + Math.sin(angle) * radius
      const x2 = centerX + Math.cos(angle) * (radius + amplitude)
      const y2 = centerY + Math.sin(angle) * (radius + amplitude)

      const hue = (i / bufferLength) * 360
      ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    }
  }

  const drawParticles = (ctx: CanvasRenderingContext2D, WIDTH: number, HEIGHT: number) => {
    if (!dataArrayRef.current) return

    const bufferLength = dataArrayRef.current.length

    for (let i = 0; i < bufferLength; i++) {
      const x = (i / bufferLength) * WIDTH
      const y = HEIGHT / 2
      const size = (dataArrayRef.current[i] / 255) * 20

      const hue = (i / bufferLength) * 360
      ctx.fillStyle = `hsl(${hue}, 100%, 50%)`
      ctx.beginPath()
      ctx.arc(x, y, size, 0, 2 * Math.PI)
      ctx.fill()
    }
  }

  const cycleVisualizer = () => {
    setVisualizerType((current) => {
      switch (current) {
        case "bars":
          return "wave"
        case "wave":
          return "circle"
        case "circle":
          return "particles"
        case "particles":
          return "bars"
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] flex flex-col bg-black">
        <SheetHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-white">Audio Visualizer</SheetTitle>
            <Button variant="ghost" size="sm" onClick={cycleVisualizer} className="text-white">
              <Wand2 className="w-4 h-4 mr-2" />
              Change Style
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 flex items-center justify-center">
          {!isInitialized ? (
            <div className="text-center text-white">
              <p className="text-sm text-muted-foreground">Initializing visualizer...</p>
            </div>
          ) : (
            <canvas ref={canvasRef} width={800} height={400} className="w-full h-full" />
          )}
        </div>

        <div className="flex-shrink-0 text-center pb-4">
          <p className="text-xs text-muted-foreground text-white/70">
            Style: {visualizerType.charAt(0).toUpperCase() + visualizerType.slice(1)}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
