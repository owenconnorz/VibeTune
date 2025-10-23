"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface ProgressiveImageProps {
  src: string
  alt: string
  className?: string
  rounded?: "none" | "sm" | "md" | "lg" | "full"
}

export function ProgressiveImage({ src, alt, className, rounded = "lg" }: ProgressiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)

  const normalizedSrc = src?.startsWith("//") ? `https:${src}` : src
  // </CHANGE>

  useEffect(() => {
    setIsLoaded(false)
    setIsError(false)

    console.log("[v0] Loading image:", normalizedSrc)
    // </CHANGE>
  }, [normalizedSrc])

  const roundedClass = {
    none: "",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  }[rounded]

  return (
    <div className={cn("relative w-full h-full overflow-hidden", roundedClass, className)}>
      {/* Loading placeholder */}
      <div
        className={cn(
          "absolute inset-0 bg-muted transition-opacity duration-300",
          isLoaded ? "opacity-0" : "opacity-100",
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-muted via-muted/80 to-muted/60 animate-pulse" />
      </div>

      {/* Actual image */}
      <img
        src={normalizedSrc || "/placeholder.svg"}
        alt={alt}
        className={cn(
          "w-full h-full object-cover transition-all duration-500",
          isLoaded ? "opacity-100 blur-0 scale-100" : "opacity-0 blur-md scale-105",
          isError && "opacity-50",
        )}
        onLoad={() => {
          console.log("[v0] Image loaded successfully:", normalizedSrc)
          setIsLoaded(true)
        }}
        onError={(e) => {
          console.error("[v0] Image failed to load:", normalizedSrc, e)
          setIsError(true)
          setIsLoaded(true)
        }}
        crossOrigin="anonymous"
        // </CHANGE>
      />
    </div>
  )
}
