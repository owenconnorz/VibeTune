"use client"

import type React from "react"

import { useState } from "react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAudioPlayer } from "@/contexts/audio-player-context"
import { usePlaylist } from "@/contexts/playlist-context"
import { useDownload } from "@/contexts/download-context"
import { AddToPlaylistDialog } from "@/components/add-to-playlist-dialog"
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
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false)

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

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {trigger || (
            <Button variant="ghost" size="icon" className={`text-gray-400 hover:text-white ${className}`}>
              <MoreVertical className="w-4 h-4" />
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-zinc-800 border-zinc-700" align="end">
          {/* Quick Action Buttons */}
          <div className="flex gap-2 p-2 mb-2">
            <Button
              variant="secondary"
              size="sm"
              className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white"
              onClick={handlePlayNext}
            >
              <Play className="w-4 h-4 mr-2" />
              Play next
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white"
              onClick={() => setShowAddToPlaylist(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add to playlist
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white"
              onClick={handleShare}
            >
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>

          <DropdownMenuSeparator className="bg-zinc-700" />

          {/* Menu Items */}
          <DropdownMenuItem onClick={handleStartRadio} className="text-white hover:bg-zinc-700">
            <Radio className="w-4 h-4 mr-3" />
            Start radio
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => {}} className="text-white hover:bg-zinc-700">
            <Edit className="w-4 h-4 mr-3" />
            Edit
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleAddToQueue} className="text-white hover:bg-zinc-700">
            <ListPlus className="w-4 h-4 mr-3" />
            Add to queue
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleAddToLibrary} className="text-white hover:bg-zinc-700">
            <Library className="w-4 h-4 mr-3" />
            Add to library
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleDownload} className="text-white hover:bg-zinc-700">
            <Download className="w-4 h-4 mr-3" />
            Download
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-zinc-700" />

          <DropdownMenuItem onClick={handleViewArtist} className="text-white hover:bg-zinc-700">
            <User className="w-4 h-4 mr-3" />
            View artist
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleViewAlbum} className="text-white hover:bg-zinc-700">
            <Disc className="w-4 h-4 mr-3" />
            View album
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-zinc-700" />

          <DropdownMenuItem onClick={handleRefetch} className="text-white hover:bg-zinc-700">
            <RefreshCw className="w-4 h-4 mr-3" />
            Refetch
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleDetails} className="text-white hover:bg-zinc-700">
            <Info className="w-4 h-4 mr-3" />
            Details
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Add to Playlist Dialog */}
      <AddToPlaylistDialog songs={[song]} isOpen={showAddToPlaylist} onClose={() => setShowAddToPlaylist(false)} />
    </>
  )
}
