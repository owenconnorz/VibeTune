"use client"

import { ArrowLeft, Github, Heart, Code, Music } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function AboutPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background z-30 border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-2xl font-bold">About</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6 max-w-2xl pb-32">
        {/* App Info */}
        <Card className="p-6 text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center">
            <Music className="w-10 h-10 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">VibeTune</h2>
            <p className="text-muted-foreground">Your personal music streaming experience</p>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>Version 1.0.0</span>
            <span>•</span>
            <span>2024</span>
          </div>
        </Card>

        {/* Creator */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Code className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold">Created by</h3>
              <p className="text-muted-foreground">Owen Ziska</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            VibeTune is a modern, open-source music streaming application built with Next.js, designed to provide a
            seamless music listening experience with features like offline playback, playlists, and more.
          </p>
        </Card>

        {/* GitHub */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
              <Github className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold">Open Source</h3>
              <p className="text-sm text-muted-foreground">Contribute on GitHub</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            VibeTune is open source and available on GitHub. Feel free to contribute, report issues, or star the
            repository!
          </p>
          <Link href="https://github.com/owenziska/vibetune" target="_blank" rel="noopener noreferrer">
            <Button className="w-full bg-transparent" variant="outline">
              <Github className="w-4 h-4 mr-2" />
              View on GitHub
            </Button>
          </Link>
        </Card>

        {/* Features */}
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold">Features</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Stream millions of songs from YouTube Music</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Create and manage custom playlists</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Download songs for offline playback</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Beautiful, customizable themes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Advanced audio controls and equalizer</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Progressive Web App (PWA) support</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Cast to Chromecast and other devices</span>
            </li>
          </ul>
        </Card>

        {/* Made with Love */}
        <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <div className="flex items-center justify-center gap-2 text-sm">
            <span>Made with</span>
            <Heart className="w-4 h-4 fill-red-500 text-red-500" />
            <span>by Owen Ziska</span>
          </div>
        </Card>

        {/* Legal */}
        <div className="text-center text-xs text-muted-foreground space-y-1">
          <p>VibeTune is not affiliated with YouTube or Google.</p>
          <p>All music content is streamed from YouTube.</p>
        </div>
      </div>
    </div>
  )
}
