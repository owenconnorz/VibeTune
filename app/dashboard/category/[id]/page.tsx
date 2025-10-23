"use client"

import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAPI } from "@/lib/use-api"
import Link from "next/link"
import { CategorySubcategory } from "@/components/category-subcategory"

interface CategoryPageProps {
  params: { id: string }
}

interface Playlist {
  id: string
  title: string
  artist: string
  thumbnail: string
  duration: string
}

interface Subcategory {
  title: string
  playlists: Playlist[]
  continuation?: string | null
  query?: string
  index?: number
}

interface CategoryData {
  name: string
  subcategories: Subcategory[]
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const { id } = params
  const [subcategoryItems, setSubcategoryItems] = useState<Record<number, Playlist[]>>({})
  const [subcategoryContinuations, setSubcategoryContinuations] = useState<Record<number, string | null>>({})
  const [loadingMore, setLoadingMore] = useState<Record<number, boolean>>({})

  const { data, isLoading } = useAPI<CategoryData>(`/api/music/category/${id}`)

  const loadMoreForSubcategory = async (subcategoryIndex: number, continuation: string) => {
    if (loadingMore[subcategoryIndex]) return

    setLoadingMore((prev) => ({ ...prev, [subcategoryIndex]: true }))

    try {
      const response = await fetch(
        `/api/music/category/${id}?continuation=${continuation}&subcategoryIndex=${subcategoryIndex}`,
      )
      const newData = await response.json()

      if (newData.playlists && newData.playlists.length > 0) {
        setSubcategoryItems((prev) => ({
          ...prev,
          [subcategoryIndex]: [...(prev[subcategoryIndex] || []), ...newData.playlists],
        }))
        setSubcategoryContinuations((prev) => ({
          ...prev,
          [subcategoryIndex]: newData.continuation || null,
        }))
      }
    } catch (error) {
      console.error("[v0] Error loading more playlists:", error)
    } finally {
      setLoadingMore((prev) => ({ ...prev, [subcategoryIndex]: false }))
    }
  }

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center gap-4 p-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{data?.name || "Loading..."}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-8">
        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">Loading playlists...</div>
        ) : data?.subcategories && data.subcategories.length > 0 ? (
          data.subcategories.map((subcategory, index) => (
            <CategorySubcategory
              key={index}
              subcategory={subcategory}
              subcategoryIndex={index}
              onLoadMore={loadMoreForSubcategory}
              additionalPlaylists={subcategoryItems[index] || []}
              continuationToken={subcategoryContinuations[index]}
              isLoadingMore={loadingMore[index] || false}
            />
          ))
        ) : (
          <div className="py-12 text-center text-muted-foreground">No playlists found</div>
        )}
      </div>
    </div>
  )
}
