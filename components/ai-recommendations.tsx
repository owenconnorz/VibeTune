"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, RefreshCw, Music, TrendingUp } from "lucide-react"
import { useAIRecommendations } from "@/hooks/use-ai-features"
import { searchMusic } from "@/lib/music-data"
import { useAudioPlayer } from "@/contexts/audio-player-context"

export function AIRecommendations() {
  const { recommendations, loading, error, generateRecommendations } = useAIRecommendations()
  const { playQueue } = useAudioPlayer()
  const [loadingMusic, setLoadingMusic] = useState<string | null>(null)

  useEffect(() => {
    generateRecommendations()
  }, [generateRecommendations])

  const handlePlayRecommendation = async (query: string) => {
    try {
      setLoadingMusic(query)
      const songs = await searchMusic(query, 10)
      if (songs.length > 0) {
        const tracks = songs.map((song) => ({
          id: song.id,
          title: song.title,
          artist: song.artist || song.channelTitle,
          thumbnail: song.thumbnail,
          duration: song.duration,
        }))
        playQueue(tracks, 0)
      }
    } catch (err) {
      console.error("Failed to play recommendation:", err)
    } finally {
      setLoadingMusic(null)
    }
  }

  if (error) {
    return (
      <Card className="bg-zinc-800 border-zinc-700">
        <CardContent className="p-6 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={() => generateRecommendations()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-zinc-800 border-zinc-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Sparkles className="w-5 h-5 text-yellow-400" />
          AI Recommendations
        </CardTitle>
        <CardDescription className="text-gray-400">
          Personalized music suggestions based on your listening history
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-zinc-700 rounded mb-2"></div>
                <div className="h-3 bg-zinc-700 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div key={index} className="p-3 bg-zinc-700/50 rounded-lg">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="text-white font-medium mb-1">{rec.query}</h4>
                      <p className="text-gray-400 text-sm mb-2">{rec.reason}</p>
                      <span className="inline-flex items-center gap-1 text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded">
                        <Music className="w-3 h-3" />
                        {rec.mood}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handlePlayRecommendation(rec.query)}
                      disabled={loadingMusic === rec.query}
                      className="bg-yellow-600 hover:bg-yellow-700 text-black"
                    >
                      {loadingMusic === rec.query ? (
                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <TrendingUp className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button
              onClick={() => generateRecommendations()}
              variant="outline"
              className="w-full border-zinc-600 text-gray-300 hover:bg-zinc-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Get New Recommendations
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
