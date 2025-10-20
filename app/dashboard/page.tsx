import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { DashboardContent } from "@/components/dashboard-content"
import { Header } from "@/components/header"
import { MusicPlayer } from "@/components/music-player"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <Header user={session.user} />
      <main className="container mx-auto px-4 py-8">
        <DashboardContent />
      </main>
      <MusicPlayer />
    </div>
  )
}
