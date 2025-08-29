"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"

interface RenderOptimizationContextType {
  refreshRate: number
  isHighRefreshRate: boolean
  renderQuality: "low" | "medium" | "high" | "ultra"
  hardwareAcceleration: boolean
  optimizeForVideo: boolean
  setOptimizeForVideo: (optimize: boolean) => void
  setRenderQuality: (quality: "low" | "medium" | "high" | "ultra") => void
}

const RenderOptimizationContext = createContext<RenderOptimizationContextType | undefined>(undefined)

export const useRenderOptimization = () => {
  const context = useContext(RenderOptimizationContext)
  if (context === undefined) {
    throw new Error("useRenderOptimization must be used within a RenderOptimizationProvider")
  }
  return context
}

export const RenderOptimizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [refreshRate, setRefreshRate] = useState(60)
  const [isHighRefreshRate, setIsHighRefreshRate] = useState(false)
  const [renderQuality, setRenderQuality] = useState<"low" | "medium" | "high" | "ultra">("high")
  const [hardwareAcceleration, setHardwareAcceleration] = useState(true)
  const [optimizeForVideo, setOptimizeForVideo] = useState(false)

  // Detect refresh rate
  const detectRefreshRate = useCallback(() => {
    const start = performance.now()
    let frameCount = 0

    const measureFrameRate = () => {
      frameCount++
      const now = performance.now()

      if (now - start >= 1000) {
        const detectedRate = Math.round((frameCount * 1000) / (now - start))
        setRefreshRate(detectedRate)
        setIsHighRefreshRate(detectedRate > 60)
        console.log(`[v0] Detected refresh rate: ${detectedRate}Hz`)
        return
      }

      requestAnimationFrame(measureFrameRate)
    }

    requestAnimationFrame(measureFrameRate)
  }, [])

  // Detect hardware acceleration support
  const detectHardwareAcceleration = useCallback(() => {
    const canvas = document.createElement("canvas")
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
    const hasWebGL = !!gl

    // Check for hardware acceleration hints
    const hasGPU = navigator.hardwareConcurrency && navigator.hardwareConcurrency > 4
    const acceleration = hasWebGL && hasGPU

    setHardwareAcceleration(acceleration)
    console.log(`[v0] Hardware acceleration: ${acceleration ? "enabled" : "disabled"}`)
  }, [])

  // Auto-adjust render quality based on device capabilities
  const autoAdjustQuality = useCallback(() => {
    const deviceMemory = (navigator as any).deviceMemory || 4
    const connection = (navigator as any).connection
    const effectiveType = connection?.effectiveType || "4g"

    let quality: "low" | "medium" | "high" | "ultra" = "medium"

    if (deviceMemory >= 8 && hardwareAcceleration && isHighRefreshRate) {
      quality = "ultra"
    } else if (deviceMemory >= 4 && hardwareAcceleration) {
      quality = "high"
    } else if (deviceMemory >= 2) {
      quality = "medium"
    } else {
      quality = "low"
    }

    // Adjust for network conditions
    if (effectiveType === "slow-2g" || effectiveType === "2g") {
      quality = "low"
    } else if (effectiveType === "3g" && quality === "ultra") {
      quality = "high"
    }

    setRenderQuality(quality)
    console.log(`[v0] Auto-adjusted render quality: ${quality}`)
  }, [hardwareAcceleration, isHighRefreshRate])

  // Apply render optimizations
  useEffect(() => {
    const applyOptimizations = () => {
      // Set CSS custom properties for render optimization
      document.documentElement.style.setProperty("--refresh-rate", `${refreshRate}`)
      document.documentElement.style.setProperty("--render-quality", renderQuality)

      // Apply video-specific optimizations
      if (optimizeForVideo) {
        document.documentElement.style.setProperty("--video-optimization", "enabled")
        // Enable hardware acceleration for video elements
        const style = document.createElement("style")
        style.textContent = `
          video {
            transform: translateZ(0);
            will-change: transform;
            backface-visibility: hidden;
            -webkit-backface-visibility: hidden;
          }
          .video-container {
            contain: layout style paint;
            transform: translateZ(0);
          }
        `
        document.head.appendChild(style)
      }

      // Apply render quality optimizations
      const qualityStyle = document.createElement("style")
      qualityStyle.id = "render-quality-optimizations"

      let optimizations = ""
      switch (renderQuality) {
        case "ultra":
          optimizations = `
            * { image-rendering: -webkit-optimize-contrast; }
            video { filter: contrast(1.1) saturate(1.1); }
          `
          break
        case "high":
          optimizations = `
            * { image-rendering: auto; }
            video { filter: none; }
          `
          break
        case "medium":
          optimizations = `
            * { image-rendering: auto; }
            .thumbnail { image-rendering: -webkit-optimize-contrast; }
          `
          break
        case "low":
          optimizations = `
            * { image-rendering: pixelated; }
            .thumbnail { transform: scale(0.9); }
          `
          break
      }

      qualityStyle.textContent = optimizations

      // Remove existing quality styles
      const existing = document.getElementById("render-quality-optimizations")
      if (existing) existing.remove()

      document.head.appendChild(qualityStyle)
    }

    applyOptimizations()
  }, [refreshRate, renderQuality, optimizeForVideo])

  // Initialize optimizations
  useEffect(() => {
    detectRefreshRate()
    detectHardwareAcceleration()

    // Auto-adjust quality after detection
    setTimeout(autoAdjustQuality, 1500)
  }, [detectRefreshRate, detectHardwareAcceleration, autoAdjustQuality])

  const value = {
    refreshRate,
    isHighRefreshRate,
    renderQuality,
    hardwareAcceleration,
    optimizeForVideo,
    setOptimizeForVideo,
    setRenderQuality,
  }

  return <RenderOptimizationContext.Provider value={value}>{children}</RenderOptimizationContext.Provider>
}
