"use client"

import { use } from "react"
import { ArrowLeft, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useMusicPlayer } from "@/components/music-player-provider"
import { useAPI } from "@/lib/use-api"
import Image from "next/image"
import Link from "next/link"

const moods = {
  happy: { name: "Happy", color: "from-yellow-500 to-orange-500", query: "happy upbeat music" },
  sad: { name: "Sad", color: "from-blue-500 to-indigo-600", query: "sad emotional music" },
  energetic: { name: "Energetic", color: "from-red-500 to-pink-500", query: "energetic workout music" },
  calm: { name: "Calm", color: "from-green-400 to-teal-500", query: "calm relaxing music" },
  romantic: { name: "Romantic", color: "from-pink-400 to-rose-500", query: "romantic love songs" },
  party: { name: "Party", color: "from-purple-500 to-pink-500", query: "party dance music" },
  focus: { name: "Focus", color: "from-cyan-500 to-blue-500", query: "focus study music" },
  sleep: { name: "Sleep", color: "from-indigo-500 to-purple-600", query: "sleep meditation music" },
}

interface MoodPageProps {
  params: Promise<{ id: string }>
}

export default function MoodPage({ params }: MoodPageProps) {
  const { id } = use(params)
  const mood = moods[id as keyof typeof moods]
  const { playVideo, addToQueue } = useMusicPlayer()

  const { data, isLoading } = useAPI<{
    results: Array<{
      id: string
      title: string
      artist: string
      thumbnail: string
      duration: string
    }>
  }>(`/api/music/search?q=${encodeURIComponent(mood?.query || "")}`)

  if (!mood) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Mood not found</p>
      </div>
    )
  }

  const handlePlayAll = () => {
    if (data?.results && data.results.length > 0) {
      playVideo(data.results[0])
      data.results.slice(1).forEach((song) => addToQueue(song))
    }
  }

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <div className={`relative h-64 bg-gradient-to-br ${mood.color}`}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative h-full flex flex-col justify-between p-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">{mood.name}</h1>
            <p className="text-white/90">Music to match your mood</p>
          </div>
        </div>
      </div>

      {/* Play All Button */}
      <div className="px-4 py-6">
        <Button onClick={handlePlayAll} size="lg" className="w-full" disabled={!data?.results?.length}>
          <Play className="w-5 h-5 mr-2 fill-current" />
          Play All
        </Button>
      </div>

      {/* Songs List */}
      <div className="px-4 space-y-3">
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading songs...</div>
        ) : data?.results && data.results.length > 0 ? (
          data.results.map((song) => (
            <div key={song.id} className="flex items-center gap-3 group cursor-pointer" onClick={() => playVideo(song)}>
              <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                <Image src={song.thumbnail || "/placeholder.svg"} alt={song.title} fill className="object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play className="w-6 h-6 fill-white text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{song.title}</h3>
                <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
              </div>
              <span className="text-sm text-muted-foreground">{song.duration}</span>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-muted-foreground">No songs found</div>
        )}
      </div>
    </div>
  )
}
