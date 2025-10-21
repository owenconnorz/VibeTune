import useSWR from "swr"
import { cache } from "./cache"

const fetcher = async (url: string) => {
  console.log("[v0] Fetching fresh data from:", url)

  // Fetch from API
  const response = await fetch(url)
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
}

// Custom hook for API calls with caching
export function useAPI<T>(
  url: string | null,
  options?: { revalidateOnFocus?: boolean; refreshInterval?: number; revalidateOnMount?: boolean },
) {
  return useSWR<T>(url, fetcher, {
    revalidateOnFocus: options?.revalidateOnFocus ?? false,
    revalidateOnMount: options?.revalidateOnMount ?? true, // Default to true for fresh data
    refreshInterval: options?.refreshInterval ?? 0,
    dedupingInterval: 5000, // Reduced to 5 seconds for more responsive updates
    errorRetryCount: 3,
    errorRetryInterval: 5000,
    onError: (error) => {
      console.error("[v0] API error:", error)
    },
  })
}
