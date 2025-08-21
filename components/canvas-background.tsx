"use client"

import { useEffect, useRef } from "react"
import { useAudioPlayer } from "@/contexts/audio-player-context"

interface CanvasBackgroundProps {
  isEnabled: boolean
  className?: string
}

export function CanvasBackground({ isEnabled, className = "" }: CanvasBackgroundProps) {
  const { state } = useAudioPlayer()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const particlesRef = useRef<
    Array<{
      x: number
      y: number
      vx: number
      vy: number
      size: number
      color: string
      opacity: number
    }>
  >([])

  useEffect(() => {
    if (!isEnabled || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Initialize particles
    const initParticles = () => {
      const newParticles = []
      for (let i = 0; i < 50; i++) {
        newParticles.push({
          x: Math.random() * canvas.offsetWidth,
          y: Math.random() * canvas.offsetHeight,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          size: Math.random() * 3 + 1,
          color: `hsl(${Math.random() * 360}, 70%, 60%)`,
          opacity: Math.random() * 0.8 + 0.2,
        })
      }
      particlesRef.current = newParticles
    }

    initParticles()

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)

      // Create gradient background
      const gradient = ctx.createRadialGradient(
        canvas.offsetWidth / 2,
        canvas.offsetHeight / 2,
        0,
        canvas.offsetWidth / 2,
        canvas.offsetHeight / 2,
        Math.max(canvas.offsetWidth, canvas.offsetHeight) / 2,
      )
      gradient.addColorStop(0, "rgba(139, 69, 19, 0.3)")
      gradient.addColorStop(0.5, "rgba(75, 0, 130, 0.2)")
      gradient.addColorStop(1, "rgba(0, 0, 0, 0.8)")

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)

      particlesRef.current.forEach((particle) => {
        // Update position
        particle.x += particle.vx * (state.isPlaying ? 1 : 0.3)
        particle.y += particle.vy * (state.isPlaying ? 1 : 0.3)

        // Bounce off edges
        if (particle.x <= 0 || particle.x >= canvas.offsetWidth) particle.vx *= -1
        if (particle.y <= 0 || particle.y >= canvas.offsetHeight) particle.vy *= -1

        // Keep particles in bounds
        particle.x = Math.max(0, Math.min(canvas.offsetWidth, particle.x))
        particle.y = Math.max(0, Math.min(canvas.offsetHeight, particle.y))

        // Draw particle
        ctx.save()
        ctx.globalAlpha = particle.opacity * (state.isPlaying ? 1 : 0.5)
        ctx.fillStyle = particle.color
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      })

      // Add pulsing effect based on music
      if (state.isPlaying) {
        const pulseIntensity = Math.sin(Date.now() * 0.005) * 0.3 + 0.7
        ctx.save()
        ctx.globalAlpha = 0.1 * pulseIntensity
        ctx.fillStyle = "white"
        ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)
        ctx.restore()
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isEnabled, state.isPlaying])

  if (!isEnabled) return null

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ mixBlendMode: "overlay" }}
    />
  )
}
