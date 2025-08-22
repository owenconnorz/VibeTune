"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ThumbnailResult {
  title: string
  artist: string
  thumbnail: string | null
  videoId: string
  duration: string
}

export default function YTMusicTestPage() {
  const [query, setQuery] = useState("hip hop classics")
  const [results, setResults] = useState<ThumbnailResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testYTMusicAPI = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log("[v0] Testing YTMusic API with query:", query)
      const response = await fetch(`/api/ytmusic-test?query=${encodeURIComponent(query)}`)
      const data = await response.json()

      if (data.success) {
        setResults(data.results)
        console.log("[v0] YTMusic API test successful:", data.results)
      } else {
        setError(data.error)
        console.error("[v0] YTMusic API test failed:", data.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setError(errorMessage)
      console.error("[v0] YTMusic API test error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">YTMusic API Thumbnail Test</h1>

      <div className="flex gap-4 mb-6">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter search query..."
          className="flex-1"
        />
        <Button onClick={testYTMusicAPI} disabled={loading}>
          {loading ? "Testing..." : "Test API"}
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong>Error:</strong> {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((result, index) => (
            <div key={index} className="border rounded-lg p-4 bg-white shadow-sm">
              {result.thumbnail && (
                <img
                  src={result.thumbnail || "/placeholder.svg"}
                  alt={result.title}
                  className="w-full h-32 object-cover rounded mb-3"
                  onError={(e) => {
                    console.log("[v0] Thumbnail failed to load:", result.thumbnail)
                    e.currentTarget.style.display = "none"
                  }}
                />
              )}
              <h3 className="font-semibold text-sm mb-1 truncate">{result.title}</h3>
              <p className="text-gray-600 text-xs mb-1 truncate">{result.artist}</p>
              <p className="text-gray-500 text-xs">{result.duration}</p>
              <p className="text-gray-400 text-xs mt-2">ID: {result.videoId}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
