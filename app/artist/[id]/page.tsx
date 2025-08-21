"use client"
import { ArrowLeft, Play, Shuffle, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"

export default function ArtistPage() {
  const router = useRouter()
  const params = useParams()
  const artistId = params.id as string

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Header */}
      <header className="flex items-center gap-4 p-4 bg-zinc-800">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-gray-300 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold">Artist</h1>
      </header>

      <div className="px-4 pb-24">
        {/* Artist Header */}
        <div className="flex items-center gap-6 py-6">
          <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <span className="text-4xl font-bold">A</span>
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">Artist Name</h1>
            <p className="text-gray-400 mb-4">Artist • 1.2M subscribers</p>
            <div className="flex gap-3">
              <Button className="bg-yellow-400 text-black hover:bg-yellow-500">
                <Play className="w-4 h-4 mr-2" />
                Play
              </Button>
              <Button variant="outline" className="border-zinc-600 text-gray-300 hover:bg-zinc-700 bg-transparent">
                <Shuffle className="w-4 h-4 mr-2" />
                Shuffle
              </Button>
            </div>
          </div>
        </div>

        {/* Popular Songs */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4">Popular</h2>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-2 hover:bg-zinc-800/50 rounded-lg cursor-pointer group">
                <span className="text-gray-400 w-4 text-center">{i + 1}</span>
                <div className="w-12 h-12 bg-zinc-700 rounded overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500"></div>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-medium">Song Title {i + 1}</h3>
                  <p className="text-gray-400 text-sm">123M plays</p>
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

        {/* Albums */}
        <section>
          <h2 className="text-xl font-bold mb-4">Albums</h2>
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="cursor-pointer hover:opacity-80 transition-opacity">
                <div className="aspect-square bg-zinc-700 rounded-lg mb-2 overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-green-500 to-blue-500"></div>
                </div>
                <h3 className="text-white font-medium truncate">Album Title {i + 1}</h3>
                <p className="text-gray-400 text-sm">2023</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
