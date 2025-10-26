import { TopHeader } from "@/components/top-header"
import { BottomNav } from "@/components/bottom-nav"
import { MiniPlayer } from "@/components/mini-player"
import { HomeContent } from "@/components/home-content"

export default async function DashboardPage() {
  return (
    <div className="min-h-screen bg-background pb-40 pt-0">
      <TopHeader title="Home" />
      <main>
        <HomeContent />
      </main>
      <MiniPlayer />
      <BottomNav />
    </div>
  )
}
