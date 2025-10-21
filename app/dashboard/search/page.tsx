import { TopHeader } from "@/components/top-header"
import { BottomNav } from "@/components/bottom-nav"
import { MiniPlayer } from "@/components/mini-player"
import { SearchContent } from "@/components/search-content"

export default async function SearchPage() {
  return (
    <div className="min-h-screen bg-background pb-40">
      <TopHeader user={undefined} title="Search" />
      <main>
        <SearchContent />
      </main>
      <MiniPlayer />
      <BottomNav />
    </div>
  )
}
