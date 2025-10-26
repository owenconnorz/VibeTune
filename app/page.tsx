import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Music, Radio, ListMusic, Headphones, Play, Sparkles } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default function HomePage() {
  redirect("/dashboard")
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="container relative mx-auto px-4 py-20 md:py-32">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              <span>Now streaming millions of songs</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-balance mb-6">
              Your music, <span className="text-primary">your way</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground text-balance mb-8 leading-relaxed">
              Stream unlimited music, discover new artists, and create the perfect soundtrack for every moment
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="text-lg px-8 py-6" asChild>
                <Link href="/auth/signin">
                  <Play className="w-5 h-5 mr-2" />
                  Start listening free
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 bg-transparent" asChild>
                <Link href="/auth/signin">Browse catalog</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Everything you need</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Powerful features that make VibeTune the best way to enjoy your music
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Music className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Unlimited streaming</h3>
            <p className="text-muted-foreground leading-relaxed">
              Access millions of songs with crystal-clear audio quality
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Radio className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Personalized radio</h3>
            <p className="text-muted-foreground leading-relaxed">
              AI-powered stations that learn your taste and evolve with you
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <ListMusic className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart playlists</h3>
            <p className="text-muted-foreground leading-relaxed">
              Create, share, and discover playlists for every mood
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Headphones className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Offline listening</h3>
            <p className="text-muted-foreground leading-relaxed">
              Download your favorites and listen anywhere, anytime
            </p>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 border-primary/20">
          <div className="p-12 md:p-16 text-center">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Ready to start your journey?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join millions of music lovers and discover your next favorite song today
            </p>
            <Button size="lg" className="text-lg px-8 py-6" asChild>
              <Link href="/auth/signin">
                <Play className="w-5 h-5 mr-2" />
                Get started now
              </Link>
            </Button>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Music className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold">VibeTune</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2025 VibeTune. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
