"use client"

import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRefresh } from "@/contexts/refresh-context"
import { cn } from "@/lib/utils"

interface RefreshButtonProps {
  className?: string
  size?: "sm" | "md" | "lg"
  variant?: "default" | "ghost" | "outline"
  showText?: boolean
}

export function RefreshButton({ className, size = "md", variant = "ghost", showText = false }: RefreshButtonProps) {
  const { isRefreshing, refreshAll, lastRefresh } = useRefresh()

  const formatLastRefresh = () => {
    if (!lastRefresh) return "Never refreshed"
    const now = new Date()
    const diff = now.getTime() - lastRefresh.getTime()
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return lastRefresh.toLocaleDateString()
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={refreshAll}
      disabled={isRefreshing}
      className={cn("transition-all duration-200", isRefreshing && "animate-pulse", className)}
      title={`Refresh music data - Last updated: ${formatLastRefresh()}`}
    >
      <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin", showText && "mr-2")} />
      {showText && (isRefreshing ? "Refreshing..." : "Refresh")}
    </Button>
  )
}
