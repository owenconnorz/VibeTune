"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

export interface LikedSong {
  id: string
  title: string
  artist: string
  thumbnail?: string
  duration?: string
  likedAt: string
}

interface LikedSongsContextType {
  likedSongs: LikedSong[]
  isLiked: (songId: string) => boolean
  toggleLike: (song: {
    id: string
    title: string
    artist: string
    thumbnail?: string
    duration?: string
  }) => void
  clearLikedSongs: () => void
}

const LikedSongsContext = createContext<LikedSongsContextType | undefined>(undefined)

const LIKED_SONGS_STORAGE_KEY = "vibetune-liked-songs"

export function LikedSongsProvider({ children }: { children: ReactNode }) {
  const [likedSongs, setLikedSongs] = useState<LikedSong[]>([])

  // Load liked songs from localStorage on mount
  useEffect(() => {
    const savedLikedSongs = localStorage.getItem(LIKED_SONGS_STORAGE_KEY)
    if (savedLikedSongs) {
      try {
        setLikedSongs(JSON.parse(savedLikedSongs))
      } catch (error) {
        console.error("Error loading liked songs:", error)
      }
    }
  }, [])

  // Save liked songs to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(LIKED_SONGS_STORAGE_KEY, JSON.stringify(likedSongs))
  }, [likedSongs])

  const isLiked = (songId: string): boolean => {
    return likedSongs.some((song) => song.id === songId)
  }

  const toggleLike = (song: {
    id: string
    title: string
    artist: string
    thumbnail?: string
    duration?: string
  }) => {
    setLikedSongs((prev) => {
      const isCurrentlyLiked = prev.some((likedSong) => likedSong.id === song.id)

      if (isCurrentlyLiked) {
        // Remove from liked songs
        return prev.filter((likedSong) => likedSong.id !== song.id)
      } else {
        // Add to liked songs
        const newLikedSong: LikedSong = {
          ...song,
          likedAt: new Date().toISOString(),
        }
        return [...prev, newLikedSong]
      }
    })
  }

  const clearLikedSongs = () => {
    setLikedSongs([])
    localStorage.removeItem(LIKED_SONGS_STORAGE_KEY)
  }

  return (
    <LikedSongsContext.Provider
      value={{
        likedSongs,
        isLiked,
        toggleLike,
        clearLikedSongs,
      }}
    >
      {children}
    </LikedSongsContext.Provider>
  )
}

export function useLikedSongs() {
  const context = useContext(LikedSongsContext)
  if (context === undefined) {
    throw new Error("useLikedSongs must be used within a LikedSongsProvider")
  }
  return context
}
