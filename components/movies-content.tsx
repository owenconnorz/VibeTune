"use client"

import { useEffect, useState } from "react"
import { Play, Info, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"

interface Movie {
  id: string
  title: string
  thumbnail: string
  rating: string
  year: number
  duration: string
  description?: string
}

interface Category {
  id: string
  title: string
  items: Movie[]
}

interface FeaturedContent {
  hero: Movie & {
    genres: string[]
  }
  categories: Category[]
}

export function MoviesContent() {
  const [content, setContent] = useState<FeaturedContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchContent = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    setError(null)

    try {
      console.log("[v0] Fetching movies from /api/movies/featured")
      const response = await fetch("/api/movies/featured", {
        cache: "no-store",
      })

      console.log("[v0] Movies API response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] Movies API error:", errorData)
        throw new Error(errorData.message || "Failed to fetch movies")
      }

      const data = await response.json()
      console.log("[v0] Movies data received:", data.hero?.title, "categories:", data.categories?.length)
      setContent(data)
    } catch (error) {
      console.error("[v0] Error fetching movies:", error)
      setError(error instanceof Error ? error.message : "Failed to load movies")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchContent()
  }, [])

  useEffect(() => {
    let startY = 0
    let currentY = 0
    let isPulling = false

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY
        isPulling = true
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling) return
      currentY = e.touches[0].clientY
      const pullDistance = currentY - startY

      if (pullDistance > 80 && !refreshing) {
        // Visual feedback could be added here
      }
    }

    const handleTouchEnd = () => {
      if (!isPulling) return
      const pullDistance = currentY - startY

      if (pullDistance > 80 && !refreshing) {
        fetchContent(true)
      }

      isPulling = false
      startY = 0
      currentY = 0
    }

    document.addEventListener("touchstart", handleTouchStart)
    document.addEventListener("touchmove", handleTouchMove)
    document.addEventListener("touchend", handleTouchEnd)

    return () => {
      document.removeEventListener("touchstart", handleTouchStart)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleTouchEnd)
    }
  }, [refreshing])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <div className="text-muted-foreground">Loading movies...</div>
          <div className="text-xs text-muted-foreground">Fetching from TMDB</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="text-muted-foreground">Failed to load movies</div>
          <div className="text-xs text-muted-foreground">{error}</div>
          <Button onClick={() => fetchContent()} variant="secondary">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!content || !content.hero) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="text-muted-foreground">No movies available</div>
          <Button onClick={() => fetchContent()} variant="secondary">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {refreshing && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border">
          <div className="flex items-center gap-2 text-sm">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Refreshing...</span>
          </div>
        </div>
      )}

      <div className="fixed bottom-28 right-4 z-40">
        <Button
          size="icon"
          variant="secondary"
          className="h-12 w-12 rounded-full shadow-lg"
          onClick={() => fetchContent(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="relative h-[70vh] -mt-16">
        <div className="absolute inset-0">
          <img
            src={content.hero.thumbnail || "/placeholder.svg"}
            alt={content.hero.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
        </div>

        <div className="relative h-full flex items-end pb-20 px-4 md:px-8">
          <div className="max-w-2xl space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold text-balance">{content.hero.title}</h1>
            <div className="flex items-center gap-3 text-sm">
              <span className="px-2 py-1 border border-muted-foreground/50 rounded">{content.hero.rating}</span>
              <span>{content.hero.year}</span>
              <span>{content.hero.duration}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {content.hero.genres.map((genre) => (
                <span key={genre} className="text-sm text-muted-foreground">
                  {genre}
                </span>
              ))}
            </div>
            <p className="text-lg leading-relaxed line-clamp-3">{content.hero.description}</p>
            <div className="flex gap-3 pt-2">
              <Button size="lg" className="gap-2" asChild>
                <Link href={`/movies/${content.hero.id}`}>
                  <Play className="w-5 h-5" />
                  Play
                </Link>
              </Button>
              <Button size="lg" variant="secondary" className="gap-2" asChild>
                <Link href={`/movies/${content.hero.id}`}>
                  <Info className="w-5 h-5" />
                  More Info
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8 px-4 md:px-8">
        {content.categories.map((category) => (
          <MovieRow key={category.id} category={category} />
        ))}
      </div>
    </div>
  )
}

function MovieRow({ category }: { category: Category }) {
  const [scrollPosition, setScrollPosition] = useState(0)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const handleScroll = (direction: "left" | "right") => {
    const container = document.getElementById(`row-${category.id}`)
    if (!container) return

    const scrollAmount = container.clientWidth * 0.8
    const newPosition = direction === "left" ? scrollPosition - scrollAmount : scrollPosition + scrollAmount

    container.scrollTo({ left: newPosition, behavior: "smooth" })
    setScrollPosition(newPosition)

    setTimeout(() => {
      setCanScrollLeft(container.scrollLeft > 0)
      setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth)
    }, 300)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{category.title}</h2>
      <div className="relative group">
        {canScrollLeft && (
          <button
            onClick={() => handleScroll("left")}
            className="absolute left-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-r from-background to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => handleScroll("right")}
            className="absolute right-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-l from-background to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        )}

        <div
          id={`row-${category.id}`}
          className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {category.items.map((movie) => (
            <Link key={movie.id} href={`/movies/${movie.id}`} className="flex-shrink-0 w-48 group/card">
              <Card className="overflow-hidden border-0 bg-card/50 hover:bg-card transition-all hover:scale-105">
                <div className="aspect-[2/3] relative">
                  <img
                    src={movie.thumbnail || "/placeholder.svg"}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-12 h-12" />
                  </div>
                </div>
                <div className="p-3 space-y-1">
                  <h3 className="font-semibold line-clamp-1 text-sm">{movie.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{movie.year}</span>
                    <span>•</span>
                    <span>{movie.duration}</span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
