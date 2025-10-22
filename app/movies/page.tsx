import { TopHeader } from "@/components/top-header"
import { BottomNav } from "@/components/bottom-nav"
import { MoviesContent } from "@/components/movies-content"

export default function MoviesPage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <TopHeader user={undefined} title="Movies" showSearch />
      <main>
        <MoviesContent />
      </main>
      <BottomNav />
    </div>
  )
}
