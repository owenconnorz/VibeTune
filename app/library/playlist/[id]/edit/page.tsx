"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Camera, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePlaylist } from "@/contexts/playlist-context"

export default function EditPlaylistPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { playlists, updatePlaylist } = usePlaylist()
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [coverImage, setCoverImage] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [playlist, setPlaylist] = useState<any>(null)

  useEffect(() => {
    const fetchedPlaylist = playlists.find((p) => p.id === params.id)
    if (fetchedPlaylist) {
      setPlaylist(fetchedPlaylist)
      setName(fetchedPlaylist.title)
      setCoverImage(fetchedPlaylist.thumbnail || "/placeholder.svg?height=300&width=300")
    }
  }, [params.id, playlists])

  const handleCoverImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB")
      return
    }

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setCoverImage(result)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!name.trim()) return

    setIsLoading(true)
    try {
      updatePlaylist(params.id, {
        title: name.trim(),
        thumbnail: coverImage,
      })
      router.back()
    } catch (error) {
      console.error("Failed to update playlist:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!playlist) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <header className="flex items-center justify-between p-4 bg-zinc-800">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold text-white">Edit Playlist</h1>
        </div>
        <Button onClick={handleSave} disabled={isLoading} className="bg-green-600 hover:bg-green-700">
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? "Saving..." : "Save"}
        </Button>
      </header>

      <div className="px-4 py-6 space-y-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Cover Image</h2>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-lg overflow-hidden bg-zinc-700">
              <img src={coverImage || "/placeholder.svg"} alt="Playlist cover" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 space-y-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full border-zinc-600 text-gray-300 hover:bg-zinc-700 bg-transparent"
              >
                <Camera className="w-4 h-4 mr-2" />
                Change Cover Image
              </Button>
              <p className="text-xs text-gray-400">JPG, PNG, GIF. Max 5MB</p>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleCoverImageUpload} className="hidden" />
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Playlist Name</h2>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-600 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            placeholder="Enter playlist name"
          />
        </div>
      </div>
    </div>
  )
}
