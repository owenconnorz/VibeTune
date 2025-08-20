"use client"

import type React from "react"
import {
  Play,
  Plus,
  Share,
  Radio,
  Edit,
  ListPlus,
  Library,
  Download,
  User,
  Disc,
  RefreshCw,
  Info,
  MoreVertical,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAudioPlayer } from "@/contexts/audio-player-context"
import { usePlaylist } from "@/contexts/playlist-context"
import { useDownload } from "@/contexts/download-context"
import { useLikedSongs } from "@/contexts/liked-songs-context"
import { toast } from "@/hooks/use-toast"

interface SongMenuProps {
  song: {
    id: string
    title: string
    artist: string
    thumbnail?: string
    duration?: string
  }
  trigger?: React.ReactNode
  className?: string
}

export function SongMenu({ song, trigger, className }: SongMenuProps) {
  const { addToQueue, playNext } = useAudioPlayer()
  const { addSongToPlaylist } = usePlaylist()
  const { downloadSong } = useDownload()
  const { isLiked, toggleLike } = useLikedSongs()

  const handlePlayNext = () => {
    const track = {
      id: song.id,
      title: song.title,
      artist: song.artist,
      thumbnail: song.thumbnail,
      duration: song.duration,
    }
    playNext(track)
    toast({
      title: "Added to queue",
      description: `"${song.title}" will play next`,
    })
  }

  const handleAddToQueue = () => {
    const track = {
      id: song.id,
      title: song.title,
      artist: song.artist,
      thumbnail: song.thumbnail,
      duration: song.duration,
    }
    addToQueue(track)
    toast({
      title: "Added to queue",
      description: `"${song.title}" added to queue`,
    })
  }

  const handleAddToLibrary = () => {
    // Add to a default "Library" playlist
    addSongToPlaylist("library", song)
    toast({
      title: "Added to library",
      description: `"${song.title}" saved to your library`,
    })
  }

  const handleAddToPlaylist = () => {
    // Add to a default "My Playlist"
    addSongToPlaylist("default", song)
    toast({
      title: "Added to playlist",
      description: `"${song.title}" added to playlist`,
    })
  }

  const handleDownload = () => {
    downloadSong(song)
    toast({
      title: "Download started",
      description: `Downloading "${song.title}"`,
    })
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: song.title,
          text: `Check out "${song.title}" by ${song.artist}`,
          url: `https://youtube.com/watch?v=${song.id}`,
        })
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(`https://youtube.com/watch?v=${song.id}`)
      toast({
        title: "Link copied",
        description: "Song link copied to clipboard",
      })
    }
  }

  const handleStartRadio = () => {
    toast({
      title: "Starting radio",
      description: `Starting radio based on "${song.title}"`,
    })
  }

  const handleViewArtist = () => {
    toast({
      title: "View artist",
      description: `Viewing ${song.artist}'s profile`,
    })
  }

  const handleViewAlbum = () => {
    toast({
      title: "View album",
      description: `Viewing album information`,
    })
  }

  const handleRefetch = () => {
    toast({
      title: "Refreshing",
      description: "Updating song information",
    })
  }

  const handleDetails = () => {
    toast({
      title: "Song details",
      description: `Showing details for "${song.title}"`,
    })
  }

  const handleToggleLike = () => {
    toggleLike(song)
    toast({
      title: isLiked(song.id) ? "Removed from liked songs" : "Added to liked songs",
      description: `"${song.title}" ${isLiked(song.id) ? "removed from" : "added to"} your liked songs`,
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className={`text-gray-400 hover:text-white ${className}`}>
            <MoreVertical className="w-4 h-4" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-80 bg-zinc-900/95 backdrop-blur-sm border-zinc-700/50 rounded-2xl shadow-2xl p-4"
        align="end"
      >
        <div className="flex gap-3 mb-4">
          <Button
            variant="secondary"
            size="lg"
            className="flex-1 h-12 bg-zinc-700/80 hover:bg-zinc-600/80 text-white rounded-xl font-medium"
            onClick={handlePlayNext}
          >
            <Play className="w-5 h-5 mr-2" />
            Play next
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="flex-1 h-12 bg-zinc-700/80 hover:bg-zinc-600/80 text-white rounded-xl font-medium"
            onClick={handleAddToPlaylist}
          >
            <Plus className="w-5 h-5 mr-2" />
            Add to playlist
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="flex-1 h-12 bg-zinc-700/80 hover:bg-zinc-600/80 text-white rounded-xl font-medium"
            onClick={handleShare}
          >
            <Share className="w-5 h-5 mr-2" />
            Share
          </Button>
        </div>

        <div className="space-y-1">
          <DropdownMenuItem
            onClick={handleStartRadio}
            className="text-white hover:bg-zinc-700/50 rounded-lg h-12 px-3 text-base font-medium"
          >
            <Radio className="w-5 h-5 mr-4 text-gray-400" />
            Start radio
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => {}}
            className="text-white hover:bg-zinc-700/50 rounded-lg h-12 px-3 text-base font-medium"
          >
            <Edit className="w-5 h-5 mr-4 text-gray-400" />
            Edit
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleAddToQueue}
            className="text-white hover:bg-zinc-700/50 rounded-lg h-12 px-3 text-base font-medium"
          >
            <ListPlus className="w-5 h-5 mr-4 text-gray-400" />
            Add to queue
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleAddToLibrary}
            className="text-white hover:bg-zinc-700/50 rounded-lg h-12 px-3 text-base font-medium"
          >
            <Library className="w-5 h-5 mr-4 text-gray-400" />
            Add to library
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleDownload}
            className="text-white hover:bg-zinc-700/50 rounded-lg h-12 px-3 text-base font-medium"
          >
            <Download className="w-5 h-5 mr-4 text-gray-400" />
            Download
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleViewArtist}
            className="text-white hover:bg-zinc-700/50 rounded-lg h-12 px-3 text-base font-medium"
          >
            <User className="w-5 h-5 mr-4 text-gray-400" />
            View artist
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleViewAlbum}
            className="text-white hover:bg-zinc-700/50 rounded-lg h-12 px-3 text-base font-medium"
          >
            <Disc className="w-5 h-5 mr-4 text-gray-400" />
            View album
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleRefetch}
            className="text-white hover:bg-zinc-700/50 rounded-lg h-12 px-3 text-base font-medium"
          >
            <RefreshCw className="w-5 h-5 mr-4 text-gray-400" />
            Refetch
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleDetails}
            className="text-white hover:bg-zinc-700/50 rounded-lg h-12 px-3 text-base font-medium"
          >
            <Info className="w-5 h-5 mr-4 text-gray-400" />
            Details
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
