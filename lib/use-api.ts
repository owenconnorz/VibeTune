import useSWR from "swr"
import { cache } from "./cache"

// SWR fetcher with localStorage cache fallback
const fetcher = async (url: string) => {
  // Try to get from cache first
  const cached = cache.get(url)
  if (cached) {
    console.log("[v0] Using cached data for:", url)
    return cached
  }

  // Fetch from API
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  const data = await response.json()

  // Cache the response
  cache.set(url, data)

  return data
}

// Custom hook for API calls with caching
export function useAPI<T>(url: string | null, options?: { revalidateOnFocus?: boolean; refreshInterval?: number }) {
  return useSWR<T>(url, fetcher, {
    revalidateOnFocus: options?.revalidateOnFocus ?? false,
    refreshInterval: options?.refreshInterval ?? 0,
    dedupingInterval: 10000, // Dedupe requests within 10 seconds
    errorRetryCount: 3,
    errorRetryInterval: 5000,
  })
}
