import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { TopHeader } from "@/components/top-header"
import { BottomNav } from "@/components/bottom-nav"
import { MiniPlayer } from "@/components/mini-player"
import { LibraryContent } from "@/components/library-content"

export default async function LibraryPage() {
  const session = await getServerSession(authOptions)

  return (
    <div className="min-h-screen bg-background pb-40">
      <TopHeader user={session?.user} title="Library" />
      <main>
        <LibraryContent />
      </main>
      <MiniPlayer />
      <BottomNav />
    </div>
  )
}
