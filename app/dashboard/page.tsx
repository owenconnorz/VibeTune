import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { TopHeader } from "@/components/top-header"
import { BottomNav } from "@/components/bottom-nav"
import { MiniPlayer } from "@/components/mini-player"
import { HomeContent } from "@/components/home-content"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  return (
    <div className="min-h-screen bg-background pb-40">
      <TopHeader user={session?.user} title="Home" />
      <main>
        <HomeContent />
      </main>
      <MiniPlayer />
      <BottomNav />
    </div>
  )
}
