"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { UserPlus, UserCheck } from "lucide-react"
import { artistStorage } from "@/lib/artist-storage"
import { useToast } from "@/hooks/use-toast"

interface ArtistFollowButtonProps {
  artistId: string
  artistName: string
  artistThumbnail?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  showText?: boolean
}

export function ArtistFollowButton({
  artistId,
  artistName,
  artistThumbnail,
  variant = "outline",
  size = "default",
  showText = true,
}: ArtistFollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setIsFollowing(artistStorage.isFollowing(artistId))

    const handleUpdate = () => {
      setIsFollowing(artistStorage.isFollowing(artistId))
    }

    window.addEventListener("artistsUpdated", handleUpdate)
    return () => window.removeEventListener("artistsUpdated", handleUpdate)
  }, [artistId])

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (isFollowing) {
      artistStorage.unfollowArtist(artistId)
      toast({
        title: "Unfollowed",
        description: `You unfollowed ${artistName}`,
      })
    } else {
      artistStorage.followArtist({
        id: artistId,
        name: artistName,
        thumbnail: artistThumbnail,
      })
      toast({
        title: "Following",
        description: `You're now following ${artistName}`,
      })
    }
  }

  if (!showText) {
    return (
      <Button variant={variant} size={size} onClick={handleToggle}>
        {isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
      </Button>
    )
  }

  return (
    <Button variant={isFollowing ? "secondary" : variant} size={size} onClick={handleToggle} className="gap-2">
      {isFollowing ? (
        <>
          <UserCheck className="w-4 h-4" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          Follow
        </>
      )}
    </Button>
  )
}
