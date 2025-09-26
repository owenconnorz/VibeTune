"use client"

import { useState, useEffect } from "react"
import { Search, Play, User, Grid } from "lucide-react"
import { useRouter } from "next/navigation"
import { AudioPlayer } from "@/components/audio-player"

interface Category {
  id: string
  name: string
  count: number
  thumbnail: string
}

export default function CategoriesPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setIsLoading(true)

    try {
      const mockCategories: Category[] = [
        { id: "amateur", name: "Amateur", count: 125000, thumbnail: "/amateur-photographer.png" },
        { id: "anal", name: "Anal", count: 98000, thumbnail: "/placeholder-umb47.png" },
        { id: "asian", name: "Asian", count: 87000, thumbnail: "/diverse-asian-faces.png" },
        { id: "bbw", name: "BBW", count: 45000, thumbnail: "/placeholder-fk481.png" },
        { id: "big-ass", name: "Big Ass", count: 156000, thumbnail: "/placeholder-e3206.png" },
        { id: "big-tits", name: "Big Tits", count: 189000, thumbnail: "/placeholder-2l6dk.png" },
        { id: "blonde", name: "Blonde", count: 134000, thumbnail: "/person-with-blonde-hair.png" },
        { id: "blowjob", name: "Blowjob", count: 167000, thumbnail: "/placeholder-qc950.png" },
        { id: "brunette", name: "Brunette", count: 112000, thumbnail: "/brunette-woman.png" },
        { id: "creampie", name: "Creampie", count: 78000, thumbnail: "/placeholder-oa22t.png" },
        { id: "cumshot", name: "Cumshot", count: 145000, thumbnail: "/placeholder-xpod1.png" },
        { id: "ebony", name: "Ebony", count: 89000, thumbnail: "/ebony-wood.png" },
        { id: "hardcore", name: "Hardcore", count: 234000, thumbnail: "/placeholder-p5ogt.png" },
        { id: "latina", name: "Latina", count: 76000, thumbnail: "/latina-woman-smiling.png" },
        { id: "milf", name: "MILF", count: 123000, thumbnail: "/placeholder-zafo5.png" },
        { id: "teen", name: "Teen", count: 198000, thumbnail: "/diverse-teenagers.png" },
      ]

      setCategories(mockCategories)
    } catch (error) {
      console.error("[v0] Categories fetch error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCategoryClick = (category: Category) => {
    router.push(`/videos?search=${encodeURIComponent(category.name)}`)
  }

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="bg-black border-b border-gray-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-white">Categories</h1>
          </div>
          <div className="flex items-center gap-4">
            <Search className="w-6 h-6 text-gray-400 cursor-pointer hover:text-white" />
            <User className="w-6 h-6 text-gray-400 cursor-pointer hover:text-white" />
          </div>
        </div>

        <div className="flex gap-6 mb-4 overflow-x-auto">
          <button
            className="text-gray-400 hover:text-white font-semibold whitespace-nowrap pb-2"
            onClick={() => router.push("/videos")}
          >
            VIDEOS
          </button>
          <button className="text-gray-400 hover:text-white font-semibold whitespace-nowrap pb-2">LIVE CAMS</button>
          <button className="text-orange-500 font-semibold whitespace-nowrap border-b-2 border-orange-500 pb-2">
            CATEGORIES
          </button>
          <button className="text-gray-400 hover:text-white font-semibold whitespace-nowrap pb-2">MODELS</button>
        </div>

        <div className="flex gap-2 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900 text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 border border-gray-700"
              placeholder="Search categories..."
            />
          </div>
        </div>
      </div>

      <div className="p-4 pb-20">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
              <p className="text-gray-400">Loading categories...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-gray-400 text-sm">Browse {filteredCategories.length} categories</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className="bg-gray-900 rounded-lg overflow-hidden hover:bg-gray-800 transition-colors group cursor-pointer"
                  onClick={() => handleCategoryClick(category)}
                >
                  <div className="relative aspect-video">
                    <img
                      src={category.thumbnail || "/placeholder.svg"}
                      alt={category.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-white bg-opacity-20 rounded-full p-3">
                        <Grid className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                      {category.count.toLocaleString()}
                    </div>
                  </div>

                  <div className="p-3">
                    <h3 className="font-medium text-base text-center hover:text-orange-500 transition-colors">
                      {category.name}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <AudioPlayer />

      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800">
        <div className="flex items-center justify-around py-1">
          <div className="flex flex-col items-center py-1 px-3 cursor-pointer" onClick={() => router.push("/")}>
            <div className="w-5 h-5 text-gray-400 mb-0.5 flex items-center justify-center">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            </div>
            <span className="text-[10px] text-gray-400">Home</span>
          </div>
          <div className="flex flex-col items-center py-1 px-3 cursor-pointer" onClick={() => router.push("/explore")}>
            <div className="w-5 h-5 text-gray-400 mb-0.5 flex items-center justify-center">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span className="text-[10px] text-gray-400">Explore</span>
          </div>
          <div className="flex flex-col items-center py-1 px-3 cursor-pointer" onClick={() => router.push("/videos")}>
            <div className="bg-orange-500 rounded-full p-1.5 mb-0.5">
              <div className="w-4 h-4 text-white flex items-center justify-center">
                <Play className="w-3 h-3" />
              </div>
            </div>
            <span className="text-[10px] text-white font-medium">Videos</span>
          </div>
          <div className="flex flex-col items-center py-1 px-3 cursor-pointer" onClick={() => router.push("/library")}>
            <div className="w-5 h-5 text-gray-400 mb-0.5 flex items-center justify-center">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
              </svg>
            </div>
            <span className="text-[10px] text-gray-400">Library</span>
          </div>
        </div>
      </nav>
    </div>
  )
}
