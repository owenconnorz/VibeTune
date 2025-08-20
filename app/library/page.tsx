"use client"

import { useState } from "react"
import Link from "next/link"
import {
  History,
  TrendingUp,
  User,
  ChevronDown,
  Grid3X3,
  Heart,
  CheckCircle,
  ArrowUpRight,
  RotateCcw,
  Play,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { useSync } from "@/contexts/sync-context"
import { useAudioPlayer } from "@/contexts/audio-player-context"

export default function LibraryPage() {
  const { user } = useAuth()
  const { syncData } = useSync()
  const { state, playTrack, togglePlayPause, nextTrack } = useAudioPlayer()
  const [activeTab, setActiveTab] = useState<"playlists" | "songs" | "albums" | "artists">("playlists")

  const mockPlaylists = [
    { id: "liked", title: "Liked", icon: Heart, count: syncData.likedSongs.length, color: "text-red-500" },
    { id: "downloaded", title: "Downloaded", icon: CheckCircle, count: 45, color: "text-green-500" },
    { id: "top10", title: "My top 10", icon: ArrowUpRight, count: 10, color: "text-blue-500" },
    { id: "cached", title: "Cached", icon: RotateCcw, count: 23, color: "text-gray-400" },
    {
      id: "red-hot",
      title: "Red Hot C...",
      count: 2,
      thumbnail: "https://i.scdn.co/image/ab67616d0000b273e319baafd16e84f0408af2a0",
      isPlaylist: true,
    },
    {
      id: "music",
      title: "music 🎵",
      count: 279,
      thumbnail: "/placeholder-ovkam.png",
      isPlaylist: true,
    },
    {
      id: "random",
      title: "Random 🍓",
      count: 156,
      thumbnail: "/placeholder-he0wd.png",
      isPlaylist: true,
    },
    {
      id: "ours",
      title: "Ours",
      count: 89,
      thumbnail: "/collaborative-playlist.png",
      isPlaylist: true,
    },
  ]

  const currentTrack = {
    title: "Ghetto Paradise",
    artist: "Chronix",
    thumbnail: "/placeholder-k2vzs.png",
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <header className="flex items-center justify-between p-4 bg-zinc-900">
        <h1 className="text-2xl font-bold text-white">Library</h1>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <History className="w-6 h-6" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <TrendingUp className="w-6 h-6" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <User className="w-6 h-6" />
          </Button>
        </div>
      </header>

      <nav className="flex gap-8 px-4 py-4 bg-zinc-900 border-b border-zinc-800">
        {[
          { key: "playlists", label: "Playlists" },
          { key: "songs", label: "Songs" },
          { key: "albums", label: "Albums" },
          { key: "artists", label: "Artists" },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`font-medium text-lg ${
              activeTab === tab.key ? "text-white" : "text-gray-400 hover:text-gray-300"
            }`}
            onClick={() => setActiveTab(tab.key as any)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="flex items-center justify-between px-4 py-4 bg-zinc-900">
        <div className="flex items-center gap-2 text-gray-300">
          <span>Date updated</span>
          <ChevronDown className="w-4 h-4" />
        </div>
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
          <Grid3X3 className="w-5 h-5" />
        </Button>
      </div>

      <div className="px-4 pb-32">
        {activeTab === "playlists" && (
          <div className="grid grid-cols-2 gap-4">
            {mockPlaylists.map((playlist) => (
              <Card
                key={playlist.id}
                className="bg-zinc-800 border-zinc-700 hover:bg-zinc-750 transition-colors cursor-pointer"
              >
                <CardContent className="p-4">
                  <div className="aspect-square mb-3 bg-zinc-700 rounded-lg flex items-center justify-center overflow-hidden">
                    {playlist.isPlaylist && playlist.thumbnail ? (
                      <img
                        src={playlist.thumbnail || "/placeholder.svg"}
                        alt={playlist.title}
                        className="w-full h-full object-cover"
                      />
                    ) : playlist.icon ? (
                      <playlist.icon className={`w-12 h-12 ${playlist.color}`} />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg" />
                    )}
                  </div>
                  <h3 className="text-white font-semibold text-sm mb-1 truncate">{playlist.title}</h3>
                  {playlist.count && (
                    <p className="text-gray-400 text-xs">
                      {playlist.count} song{playlist.count !== 1 ? "s" : ""}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {activeTab !== "playlists" && (
          <div className="text-center py-12">
            <p className="text-gray-400">Coming soon...</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-20 left-0 right-0 bg-zinc-800 border-t border-zinc-700 p-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center">
            <Play className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-semibold text-sm truncate">{currentTrack.title}</h4>
            <p className="text-gray-400 text-xs truncate">{currentTrack.artist}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
              <User className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
              <Heart className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800">
        <div className="flex items-center justify-around py-3">
          <Link href="/" className="flex flex-col items-center gap-1">
            <div className="w-6 h-6 text-gray-400 hover:text-white transition-colors">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
              </svg>
            </div>
            <span className="text-xs text-gray-400 hover:text-white transition-colors">Home</span>
          </Link>

          <Link href="/?search=true" className="flex flex-col items-center gap-1">
            <div className="w-6 h-6 text-gray-400 hover:text-white transition-colors">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
            </div>
            <span className="text-xs text-gray-400 hover:text-white transition-colors">Search</span>
          </Link>

          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 bg-yellow-600 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <span className="text-xs text-white font-medium">Library</span>
          </div>
        </div>
      </div>
    </div>
  )
}
