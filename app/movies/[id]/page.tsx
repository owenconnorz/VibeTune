import { TopHeader } from "@/components/top-header"
import { BottomNav } from "@/components/bottom-nav"
import { MoviePlayer } from "@/components/movie-player"

export default function MovieDetailPage({
  params,
}: {
  params: { id: string }
}) {
  return (
    <div className="min-h-screen bg-background pb-24">
      <TopHeader user={undefined} title="Watch" />
      <main>
        <MoviePlayer movieId={params.id} />
      </main>
      <BottomNav />
    </div>
  )
}
