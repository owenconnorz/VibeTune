"use client"

import { useEffect, useState } from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { getVidSrcEmbedUrl } from "@/lib/vidsrc-api"

interface MovieDetails {
  id: string
  title: string
  description: string
  thumbnail: string
  poster: string
  videoUrl: string
  rating: string
  year: number
  duration: string
  genres: string[]
  cast: string[]
  director: string
  voteAverage: number
  voteCount: number
}

export function MoviePlayer({ movieId }: { movieId: string }) {
  const router = useRouter()
  const [movie, setMovie] = useState<MovieDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMovie() {
      try {
        const response = await fetch(`/api/movies/${movieId}`)
        const data = await response.json()
        setMovie(data)
      } catch (error) {
        console.error("[v0] Error fetching movie:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMovie()
  }, [movieId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Loading movie...</div>
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Movie not found</div>
      </div>
    )
  }

  const embedUrl = getVidSrcEmbedUrl("movie", movieId)

  return (
    <div className="space-y-6">
      {/* Video Player */}
      <div className="relative aspect-video bg-black">
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allowFullScreen
          allow="autoplay; encrypted-media; picture-in-picture"
          title={movie.title}
        />

        {/* Back Button Overlay */}
        <div className="absolute top-4 left-4 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="text-white bg-black/50 hover:bg-black/70 backdrop-blur-sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Movie Details */}
      <div className="px-4 md:px-8 space-y-6">
        <div className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold">{movie.title}</h1>
          <div className="flex items-center gap-3 text-sm">
            <span className="px-2 py-1 border border-muted-foreground/50 rounded">{movie.rating}</span>
            <span>{movie.year}</span>
            <span>{movie.duration}</span>
            <span className="flex items-center gap-1">
              <span className="text-yellow-500">★</span>
              {movie.voteAverage.toFixed(1)}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {movie.genres.map((genre) => (
              <span key={genre} className="px-3 py-1 bg-secondary rounded-full text-sm">
                {genre}
              </span>
            ))}
          </div>
        </div>

        <Card className="p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Description</h2>
            <p className="text-muted-foreground leading-relaxed">{movie.description}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Director</h3>
            <p className="text-muted-foreground">{movie.director}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Cast</h3>
            <p className="text-muted-foreground">{movie.cast.join(", ")}</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
