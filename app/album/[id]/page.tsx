"use client"
import { ArrowLeft, Play, MoreVertical, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"

export default function AlbumPage() {
  const router = useRouter()
  const params = useParams()
  const albumId = params.id as string

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Header */}
      <header className="flex items-center gap-4 p-4 bg-zinc-800">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-gray-300 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">Album</h1>
      </header>

      <div className="px-4 pb-24">
        {/* Album Header */}
        <div className="flex items-center gap-6 py-6">
          <div className="w-32 h-32 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg overflow-hidden">
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-4xl font-bold">♪</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-gray-400 text-sm mb-1">Album</p>
            <h1 className="text-3xl font-bold mb-2">Album Title</h1>
            <p className="text-gray-400 mb-4">Artist Name • 2023 • 12 songs</p>
            <div className="flex gap-3">
              <Button className="bg-yellow-400 text-black hover:bg-yellow-500">
                <Play className="w-4 h-4 mr-2" />
                Play
              </Button>
              <Button variant="outline" className="border-zinc-600 text-gray-300 hover:bg-zinc-700 bg-transparent">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </div>

        {/* Track List */}
        <section>
          <div className="space-y-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-2 hover:bg-zinc-800/50 rounded-lg cursor-pointer group">
                <span className="text-gray-400 w-4 text-center">{i + 1}</span>
                <div className="flex-1">
                  <h3 className="text-white font-medium">Track Title {i + 1}</h3>
                  <p className="text-gray-400 text-sm">Artist Name</p>
                </div>
                <span className="text-gray-500 text-sm">3:45</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
