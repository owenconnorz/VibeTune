"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface ProgressiveImageProps {
  src: string
  alt: string
  className?: string
  fill?: boolean
  width?: number
  height?: number
  priority?: boolean
  rounded?: "none" | "sm" | "md" | "lg" | "full"
}

export function ProgressiveImage({
  src,
  alt,
  className,
  fill = true,
  width,
  height,
  priority = false,
  rounded = "lg",
}: ProgressiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    setIsLoaded(false)
    setIsError(false)
  }, [src])

  const roundedClass = {
    none: "",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  }[rounded]

  return (
    <div className={cn("relative overflow-hidden", roundedClass, className)}>
      {/* Blur placeholder */}
      <div
        className={cn(
          "absolute inset-0 bg-muted transition-opacity duration-300",
          isLoaded ? "opacity-0" : "opacity-100",
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-muted via-muted/80 to-muted/60 animate-pulse" />
      </div>

      {/* Actual image */}
      <Image
        src={src || "/placeholder.svg"}
        alt={alt}
        fill={fill}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        className={cn(
          "object-cover transition-all duration-500",
          isLoaded ? "opacity-100 blur-0 scale-100" : "opacity-0 blur-md scale-105",
          isError && "opacity-50",
        )}
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setIsError(true)
          setIsLoaded(true)
        }}
        priority={priority}
      />
    </div>
  )
}
