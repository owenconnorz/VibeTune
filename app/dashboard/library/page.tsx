import { TopHeader } from "@/components/top-header"
import { BottomNav } from "@/components/bottom-nav"
import { MiniPlayer } from "@/components/mini-player"
import { LibraryContent } from "@/components/library-content"

export default async function LibraryPage() {
  return (
    <div className="min-h-screen bg-background pb-40">
      <TopHeader user={undefined} title="Library" />
      <main>
        <LibraryContent />
      </main>
      <MiniPlayer />
      <BottomNav />
    </div>
  )
}
