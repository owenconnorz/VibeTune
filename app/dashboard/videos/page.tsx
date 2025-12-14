import { TopHeader } from "@/components/top-header"
import { BottomNav } from "@/components/bottom-nav"
import { MiniPlayer } from "@/components/mini-player"
import { VideosContent } from "@/components/videos-content"

export default async function VideosPage() {
  return (
    <div className="min-h-screen bg-background pb-40 pt-0">
      <TopHeader title="Videos" />
      <main>
        <VideosContent />
      </main>
      <MiniPlayer />
      <BottomNav />
    </div>
  )
}
