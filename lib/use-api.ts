import useSWR from "swr"
import { cache } from "./cache"

const fetcher = async (url: string) => {
  console.log("[v0] Fetching fresh data from:", url)

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)

    if (!response.ok) {
      const cached = cache.get(url)
      if (cached) {
        console.log("[v0] Using cached data as fallback for:", url)
        return cached
      }
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()

    // Cache the response
    cache.set(url, data)

    return data
  } catch (error: any) {
    if (error.name === "AbortError") {
      console.error("[v0] Request timeout for:", url)
      const cached = cache.get(url)
      if (cached) {
        console.log("[v0] Using cached data after timeout for:", url)
        return cached
      }
      throw new Error(`Request timeout: ${url}`)
    }

    const cached = cache.get(url)
    if (cached) {
      console.log("[v0] Using cached data after error for:", url)
      return cached
    }

    throw error
  }
}

// Custom hook for API calls with caching
export function useAPI<T>(
  url: string | null,
  options?: { revalidateOnFocus?: boolean; refreshInterval?: number; revalidateOnMount?: boolean },
) {
  return useSWR<T>(url, fetcher, {
    revalidateOnFocus: options?.revalidateOnFocus ?? false,
    revalidateOnMount: options?.revalidateOnMount ?? true,
    refreshInterval: options?.refreshInterval ?? 0,
    dedupingInterval: 5000,
    errorRetryCount: 3,
    errorRetryInterval: 5000,
    shouldRetryOnError: (error) => {
      // Don't retry on 404 or 403 errors
      if (error.message.includes("404") || error.message.includes("403")) {
        return false
      }
      return true
    },
    onError: (error) => {
      console.error("[v0] API error:", error)
    },
  })
}
