import useSWR from "swr"
import { cacheManager } from "./cache-manager"

const fetcher = async (url: string) => {
  console.log("[v0] Fetching data from:", url)

  const cached = cacheManager.get(url)
  if (cached) {
    console.log("[v0] Returning cached data for:", url)
    return cached
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()

    cacheManager.set(url, data, 5 * 60 * 1000)
    console.log("[v0] Cached response for:", url)

    return data
  } catch (error: any) {
    if (error.name === "AbortError") {
      console.error("[v0] Request timeout for:", url)
      throw new Error(`Request timeout: ${url}`)
    }

    throw error
  }
}

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
    revalidateIfStale: true,
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
    onSuccess: (data) => {
      console.log("[v0] API success for:", url)
    },
  })
}
