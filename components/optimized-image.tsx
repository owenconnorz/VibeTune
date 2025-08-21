"use client"

import Image from "next/image"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  fallbackSrc?: string
  priority?: boolean
  sizes?: string
  fill?: boolean
  quality?: number
  onLoad?: () => void
  onError?: () => void
}

export function OptimizedImage({
  src,
  alt,
  width = 300,
  height = 300,
  className,
  fallbackSrc = "/placeholder.svg",
  priority = false,
  sizes,
  fill = false,
  quality = 85,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = () => {
    console.log("[v0] Image failed to load, using fallback:", imgSrc)
    setHasError(true)
    setIsLoading(false)
    if (imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc)
    }
    onError?.()
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {isLoading && !hasError && (
        <div className="absolute inset-0 bg-zinc-800 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-zinc-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <Image
        src={imgSrc || "/placeholder.svg"}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        quality={quality}
        sizes={sizes || (fill ? "100vw" : `${width}px`)}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          fill ? "object-cover" : "",
          className, // Apply the same className to the Image element for proper styling inheritance
        )}
        onLoad={handleLoad}
        onError={handleError}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
      />
    </div>
  )
}

export function ThumbnailImage({
  src,
  alt,
  size = 60,
  className,
  ...props
}: Omit<OptimizedImageProps, "width" | "height"> & { size?: number }) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn("aspect-square", className)}
      sizes={`${size}px`}
      {...props}
    />
  )
}

export function PlaylistCoverImage({ src, alt, className, ...props }: Omit<OptimizedImageProps, "width" | "height">) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={300}
      height={300}
      className={cn("rounded-lg", className)}
      sizes="(max-width: 768px) 200px, 300px"
      {...props}
    />
  )
}

export function ArtistImage({ src, alt, className, ...props }: Omit<OptimizedImageProps, "width" | "height">) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={400}
      height={400}
      className={cn("rounded-full", className)}
      sizes="(max-width: 768px) 300px, 400px"
      {...props}
    />
  )
}
