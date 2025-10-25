"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface DownloadIndicatorBadgeProps {
  isDownloaded: boolean
  className?: string
  size?: "sm" | "md" | "lg"
}

export function DownloadIndicatorBadge({ isDownloaded, className, size = "md" }: DownloadIndicatorBadgeProps) {
  if (!isDownloaded) return null

  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  }

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  }

  return (
    <div
      className={cn(
        "absolute top-2 right-2 rounded-full bg-green-500 flex items-center justify-center shadow-md",
        sizeClasses[size],
        className,
      )}
    >
      <Check className={cn("text-white", iconSizes[size])} />
    </div>
  )
}
