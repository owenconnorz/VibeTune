"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface UseInfiniteScrollOptions<T> {
  fetchMore: (
    page: number,
    pageToken?: string,
  ) => Promise<{
    items: T[]
    nextPageToken?: string
    hasMore: boolean
  }>
  initialItems?: T[]
  threshold?: number
  enabled?: boolean
}

export function useInfiniteScroll<T>({
  fetchMore,
  initialItems = [],
  threshold = 1000,
  enabled = true,
}: UseInfiniteScrollOptions<T>) {
  const [items, setItems] = useState<T[]>(initialItems)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [nextPageToken, setNextPageToken] = useState<string | undefined>()
  const isInitialLoad = useRef(true)

  const loadMore = useCallback(
    async (isInitial = false) => {
      if (loading || (!hasMore && !isInitial)) return

      setLoading(true)
      setError(null)

      try {
        console.log("[v0] Loading more items, page:", isInitial ? 1 : page, "token:", nextPageToken)

        const result = await fetchMore(isInitial ? 1 : page, nextPageToken)

        console.log("[v0] Loaded", result.items.length, "new items")

        if (isInitial) {
          setItems(result.items)
          setPage(2)
        } else {
          setItems((prev) => [...prev, ...result.items])
          setPage((prev) => prev + 1)
        }

        setNextPageToken(result.nextPageToken)
        setHasMore(result.hasMore && result.items.length > 0)
      } catch (err) {
        setError("Failed to load more content")
        console.error("[v0] Error loading more items:", err)
      } finally {
        setLoading(false)
      }
    },
    [fetchMore, loading, hasMore, page, nextPageToken],
  )

  // Initial load
  useEffect(() => {
    if (isInitialLoad.current && enabled) {
      isInitialLoad.current = false
      loadMore(true)
    }
  }, [enabled])

  // Scroll detection
  useEffect(() => {
    if (!enabled) return

    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - threshold &&
        hasMore &&
        !loading &&
        enabled
      ) {
        console.log("[v0] Scroll threshold reached, loading more...")
        loadMore()
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [hasMore, loading, threshold, enabled, loadMore])

  const reset = useCallback(() => {
    setItems([])
    setPage(1)
    setNextPageToken(undefined)
    setHasMore(true)
    setError(null)
    setLoading(false)
    isInitialLoad.current = true
  }, [])

  return {
    items,
    loading,
    hasMore,
    error,
    loadMore: () => loadMore(false),
    reset,
  }
}
