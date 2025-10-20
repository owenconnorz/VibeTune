import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { BottomNav } from "@/components/bottom-nav"
import { MiniPlayer } from "@/components/mini-player"
import { SearchContent } from "@/components/search-content"

export default async function SearchPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div className="min-h-screen bg-background pb-40">
      <main>
        <SearchContent />
      </main>
      <MiniPlayer />
      <BottomNav />
    </div>
  )
}
