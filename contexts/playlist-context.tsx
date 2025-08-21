"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { Song } from "@/lib/music-data"

export interface LocalPlaylist {
  id: string
  title: string
  description: string
  thumbnail: string
  songs: Song[]
  createdAt: string
  updatedAt: string
}

interface PlaylistContextType {
  playlists: LocalPlaylist[]
  createPlaylist: (title: string, songs?: Song[], thumbnail?: string) => LocalPlaylist
  updatePlaylist: (id: string, updates: Partial<LocalPlaylist>) => void
  deletePlaylist: (id: string) => void
  addSongToPlaylist: (playlistId: string, song: Song) => void
  removeSongFromPlaylist: (playlistId: string, songId: string) => void
  addAllSongsToPlaylist: (playlistId: string, songs: Song[]) => void
  getPlaylist: (id: string) => LocalPlaylist | undefined
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined)

const PLAYLISTS_STORAGE_KEY = "vibetune-local-playlists"

export function PlaylistProvider({ children }: { children: ReactNode }) {
  const [playlists, setPlaylists] = useState<LocalPlaylist[]>([])

  // Load playlists from localStorage on mount
  useEffect(() => {
    const savedPlaylists = localStorage.getItem(PLAYLISTS_STORAGE_KEY)
    if (savedPlaylists) {
      try {
        setPlaylists(JSON.parse(savedPlaylists))
      } catch (error) {
        console.error("Error loading playlists:", error)
      }
    }
  }, [])

  // Save playlists to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(PLAYLISTS_STORAGE_KEY, JSON.stringify(playlists))
  }, [playlists])

  const createPlaylist = (title: string, songs: Song[] = [], thumbnail?: string): LocalPlaylist => {
    const newPlaylist: LocalPlaylist = {
      id: `playlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      description: "",
      thumbnail: thumbnail || "/music-playlist-concept.png",
      songs,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setPlaylists((prev) => [...prev, newPlaylist])
    return newPlaylist
  }

  const updatePlaylist = (id: string, updates: Partial<LocalPlaylist>) => {
    setPlaylists((prev) =>
      prev.map((playlist) =>
        playlist.id === id ? { ...playlist, ...updates, updatedAt: new Date().toISOString() } : playlist,
      ),
    )
  }

  const deletePlaylist = (id: string) => {
    setPlaylists((prev) => prev.filter((playlist) => playlist.id !== id))
  }

  const addSongToPlaylist = (playlistId: string, song: Song) => {
    setPlaylists((prev) =>
      prev.map((playlist) =>
        playlist.id === playlistId
          ? {
              ...playlist,
              songs: playlist.songs.some((s) => s.id === song.id) ? playlist.songs : [...playlist.songs, song],
              updatedAt: new Date().toISOString(),
            }
          : playlist,
      ),
    )
  }

  const removeSongFromPlaylist = (playlistId: string, songId: string) => {
    setPlaylists((prev) =>
      prev.map((playlist) =>
        playlist.id === playlistId
          ? {
              ...playlist,
              songs: playlist.songs.filter((song) => song.id !== songId),
              updatedAt: new Date().toISOString(),
            }
          : playlist,
      ),
    )
  }

  const addAllSongsToPlaylist = (playlistId: string, songs: Song[]) => {
    setPlaylists((prev) =>
      prev.map((playlist) =>
        playlist.id === playlistId
          ? {
              ...playlist,
              songs: [...playlist.songs, ...songs.filter((song) => !playlist.songs.some((s) => s.id === song.id))],
              updatedAt: new Date().toISOString(),
            }
          : playlist,
      ),
    )
  }

  const getPlaylist = (id: string): LocalPlaylist | undefined => {
    return playlists.find((playlist) => playlist.id === id)
  }

  return (
    <PlaylistContext.Provider
      value={{
        playlists,
        createPlaylist,
        updatePlaylist,
        deletePlaylist,
        addSongToPlaylist,
        removeSongFromPlaylist,
        addAllSongsToPlaylist,
        getPlaylist,
      }}
    >
      {children}
    </PlaylistContext.Provider>
  )
}

export function usePlaylist() {
  const context = useContext(PlaylistContext)
  if (context === undefined) {
    throw new Error("usePlaylist must be used within a PlaylistProvider")
  }
  return context
}
