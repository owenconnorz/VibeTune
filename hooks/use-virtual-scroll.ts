"use client"

import { useState, useEffect, useRef, useCallback } from "react"

interface UseVirtualScrollOptions {
  itemHeight: number
  containerHeight: number
  items: any[]
  overscan?: number
}

export function useVirtualScroll({ itemHeight, containerHeight, items, overscan = 3 }: UseVirtualScrollOptions) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const totalHeight = items.length * itemHeight
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(items.length - 1, Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan)

  const visibleItems = items.slice(startIndex, endIndex + 1).map((item, i) => ({
    item,
    index: startIndex + i,
    style: {
      position: "absolute" as const,
      top: 0,
      left: 0,
      width: "100%",
      height: `${itemHeight}px`,
      transform: `translateY(${(startIndex + i) * itemHeight}px)`,
    },
  }))

  const handleScroll = useCallback((e: Event) => {
    const target = e.target as HTMLDivElement
    setScrollTop(target.scrollTop)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener("scroll", handleScroll, { passive: true })
    return () => container.removeEventListener("scroll", handleScroll)
  }, [handleScroll])

  return {
    containerRef,
    visibleItems,
    totalHeight,
  }
}
