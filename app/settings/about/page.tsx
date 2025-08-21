import { ArrowLeft, Info, Github, Heart, Star, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AboutSettings() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/settings">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">About</h1>
        </div>

        {/* App Info */}
        <div className="space-y-6">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl font-bold">OT</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">OpenTune</h2>
            <p className="text-gray-400">Version 1.0.0</p>
          </div>

          {/* App Description */}
          <div className="bg-white/5 rounded-xl p-4 mb-6">
            <p className="text-gray-300 leading-relaxed">
              OpenTune is a modern music streaming app that brings you unlimited access to your favorite songs,
              playlists, and artists. Discover new music, create custom playlists, and enjoy high-quality audio
              streaming.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-3">Features</h3>

            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <Heart className="w-5 h-5 text-red-500" />
              <div>
                <p className="font-medium">Unlimited Music</p>
                <p className="text-sm text-gray-400">Stream millions of songs</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <Star className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="font-medium">Smart Playlists</p>
                <p className="text-sm text-gray-400">AI-powered recommendations</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <Users className="w-5 h-5 text-blue-500" />
              <div>
                <p className="font-medium">Social Features</p>
                <p className="text-sm text-gray-400">Share and discover music</p>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="space-y-3 mt-8">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 bg-white/5 border-white/10 hover:bg-white/10"
              asChild
            >
              <a href="https://github.com/opentune" target="_blank" rel="noopener noreferrer">
                <Github className="w-5 h-5" />
                View on GitHub
              </a>
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-3 bg-white/5 border-white/10 hover:bg-white/10"
              asChild
            >
              <a href="mailto:support@opentune.app">
                <Info className="w-5 h-5" />
                Contact Support
              </a>
            </Button>
          </div>

          {/* Legal */}
          <div className="text-center text-sm text-gray-400 mt-8 space-y-2">
            <p>© 2024 OpenTune. All rights reserved.</p>
            <div className="flex justify-center gap-4">
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
