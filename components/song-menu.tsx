"use client"

import type React from "react"
import { useState } from "react"
import { Play, Plus, Share, Radio, CreditCard as Edit, ListPlus, Library, User, Disc, RefreshCw, Info, MoveVertical as MoreVertical, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { useAudioPlayer } from "@/contexts/audio-player-context"
import { usePlaylist } from "@/contexts/playlist-context"
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
  const [open, setOpen] = useState(false)
  const { addToQueue, playNext } = useAudioPlayer()
  const { addSongToPlaylist } = usePlaylist()
  const { isLiked, toggleLike } = useLikedSongs()

  const closeMenu = () => setOpen(false)

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
    closeMenu()
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
    closeMenu()
  }

  const handleAddToLibrary = () => {
    addSongToPlaylist("library", song)
    toast({
      title: "Added to library",
      description: `"${song.title}" saved to your library`,
    })
    closeMenu()
  }

  const handleAddToPlaylist = () => {
    addSongToPlaylist("default", song)
    toast({
      title: "Added to playlist",
      description: `"${song.title}" added to playlist`,
    })
    closeMenu()
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
    closeMenu()
  }

  const handleStartRadio = () => {
    toast({
      title: "Starting radio",
      description: `Starting radio based on "${song.title}"`,
    })
    closeMenu()
  }

  const handleViewArtist = () => {
    toast({
      title: "View artist",
      description: `Viewing ${song.artist}'s profile`,
    })
    closeMenu()
  }

  const handleViewAlbum = () => {
    toast({
      title: "View album",
      description: `Viewing album information`,
    })
    closeMenu()
  }

  const handleRefetch = () => {
    toast({
      title: "Refreshing",
      description: "Updating song information",
    })
    closeMenu()
  }

  const handleDetails = () => {
    toast({
      title: "Song details",
      description: `Showing details for "${song.title}"`,
    })
    closeMenu()
  }

  const handleToggleLike = () => {
    toggleLike(song)
    toast({
      title: isLiked(song.id) ? "Removed from liked songs" : "Added to liked songs",
      description: `"${song.title}" ${isLiked(song.id) ? "removed from" : "added to"} your liked songs`,
    })
    closeMenu()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className={`text-gray-400 hover:text-white ${className}`}>
            <MoreVertical className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="fixed bottom-0 left-0 right-0 h-[50vh] w-full max-w-none bg-zinc-900/95 backdrop-blur-sm border-zinc-700/50 rounded-t-3xl shadow-2xl p-0 overflow-hidden z-50 transform translate-y-0">
        <div className="flex justify-end p-4 pb-2">
          <Button variant="ghost" size="icon" onClick={closeMenu} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="px-6 pb-6 overflow-y-auto">
          <div className="flex gap-3 mb-6">
            <Button
              variant="secondary"
              size="lg"
              className="flex-1 h-14 bg-zinc-700/80 hover:bg-zinc-600/80 text-white rounded-xl font-medium text-base"
              onClick={handlePlayNext}
            >
              <Play className="w-5 h-5 mr-2" />
              Play next
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="flex-1 h-14 bg-zinc-700/80 hover:bg-zinc-600/80 text-white rounded-xl font-medium text-base"
              onClick={handleAddToPlaylist}
            >
              <Plus className="w-5 h-5 mr-2" />
              Add to playlist
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="flex-1 h-14 bg-zinc-700/80 hover:bg-zinc-600/80 text-white rounded-xl font-medium text-base"
              onClick={handleShare}
            >
              <Share className="w-5 h-5 mr-2" />
              Share
            </Button>
          </div>

          <div className="space-y-2">
            <Button
              variant="ghost"
              onClick={handleStartRadio}
              className="w-full justify-start text-white hover:bg-zinc-700/50 rounded-xl h-14 px-4 text-lg font-medium"
            >
              <Radio className="w-6 h-6 mr-4 text-gray-400" />
              Start radio
            </Button>

            <Button
              variant="ghost"
              onClick={() => {}}
              className="w-full justify-start text-white hover:bg-zinc-700/50 rounded-xl h-14 px-4 text-lg font-medium"
            >
              <Edit className="w-6 h-6 mr-4 text-gray-400" />
              Edit
            </Button>

            <Button
              variant="ghost"
              onClick={handleAddToQueue}
              className="w-full justify-start text-white hover:bg-zinc-700/50 rounded-xl h-14 px-4 text-lg font-medium"
            >
              <ListPlus className="w-6 h-6 mr-4 text-gray-400" />
              Add to queue
            </Button>

            <Button
              variant="ghost"
              onClick={handleAddToLibrary}
              className="w-full justify-start text-white hover:bg-zinc-700/50 rounded-xl h-14 px-4 text-lg font-medium"
            >
              <Library className="w-6 h-6 mr-4 text-gray-400" />
              Add to library
            </Button>

            <Button
              variant="ghost"
              onClick={handleViewArtist}
              className="w-full justify-start text-white hover:bg-zinc-700/50 rounded-xl h-14 px-4 text-lg font-medium"
            >
              <User className="w-6 h-6 mr-4 text-gray-400" />
              View artist
            </Button>

            <Button
              variant="ghost"
              onClick={handleViewAlbum}
              className="w-full justify-start text-white hover:bg-zinc-700/50 rounded-xl h-14 px-4 text-lg font-medium"
            >
              <Disc className="w-6 h-6 mr-4 text-gray-400" />
              View album
            </Button>

            <Button
              variant="ghost"
              onClick={handleRefetch}
              className="w-full justify-start text-white hover:bg-zinc-700/50 rounded-xl h-14 px-4 text-lg font-medium"
            >
              <RefreshCw className="w-6 h-6 mr-4 text-gray-400" />
              Refetch
            </Button>

            <Button
              variant="ghost"
              onClick={handleDetails}
              className="w-full justify-start text-white hover:bg-zinc-700/50 rounded-xl h-14 px-4 text-lg font-medium"
            >
              <Info className="w-6 h-6 mr-4 text-gray-400" />
              Details
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
