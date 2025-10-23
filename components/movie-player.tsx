"use client"

import { useEffect, useState } from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { getVideoPlayerUrl } from "@/lib/movie-api-template"

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

  const videoUrl = movie.videoUrl || getVideoPlayerUrl(movieId)

  return (
    <div className="space-y-6">
      {/* Video Player */}
      <div className="relative aspect-video bg-black">
        {videoUrl ? (
          <iframe
            src={videoUrl}
            className="w-full h-full"
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture"
            title={movie.title}
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-white">
            <div className="text-center space-y-2">
              <p className="text-xl">Video player not configured</p>
              <p className="text-sm text-muted-foreground">Add your video URL in lib/movie-api-template.ts</p>
            </div>
          </div>
        )}

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
            {movie.rating && (
              <span className="px-2 py-1 border border-muted-foreground/50 rounded">{movie.rating}</span>
            )}
            {movie.year && <span>{movie.year}</span>}
            {movie.duration && <span>{movie.duration}</span>}
            {movie.voteAverage && (
              <span className="flex items-center gap-1">
                <span className="text-yellow-500">★</span>
                {movie.voteAverage.toFixed(1)}
              </span>
            )}
          </div>
          {movie.genres && movie.genres.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {movie.genres.map((genre) => (
                <span key={genre} className="px-3 py-1 bg-secondary rounded-full text-sm">
                  {genre}
                </span>
              ))}
            </div>
          )}
        </div>

        <Card className="p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Description</h2>
            <p className="text-muted-foreground leading-relaxed">{movie.description}</p>
          </div>

          {movie.director && (
            <div>
              <h3 className="font-semibold mb-2">Director</h3>
              <p className="text-muted-foreground">{movie.director}</p>
            </div>
          )}

          {movie.cast && movie.cast.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Cast</h3>
              <p className="text-muted-foreground">{movie.cast.join(", ")}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
