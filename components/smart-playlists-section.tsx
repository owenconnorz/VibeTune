"use client"
import { Sparkles, Smile, Cloud, Zap, Brain, Moon, CloudRain, Music } from "lucide-react"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import Link from "next/link"
import { smartPlaylistTemplates } from "@/lib/smart-playlist-generator"

const iconMap: Record<string, any> = {
  sparkles: Sparkles,
  smile: Smile,
  cloud: Cloud,
  zap: Zap,
  brain: Brain,
  moon: Moon,
  "cloud-rain": CloudRain,
  music: Music,
}

export function SmartPlaylistsSection() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-4">
        <h2 className="text-2xl font-bold">Smart Playlists</h2>
      </div>

      <ScrollArea className="w-full">
        <div className="flex gap-4 px-4 pb-4">
          {smartPlaylistTemplates.map((template) => {
            const Icon = iconMap[template.icon] || Music

            return (
              <Link key={template.id} href={`/dashboard/smart-playlist/${template.id}`}>
                <div className="w-40 flex-shrink-0">
                  <div
                    className={`aspect-square rounded-2xl bg-gradient-to-br ${template.color} flex items-center justify-center hover:opacity-80 transition-opacity`}
                  >
                    <Icon className="w-16 h-16 text-white" />
                  </div>
                  <h3 className="font-semibold mt-2 text-sm">{template.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
                </div>
              </Link>
            )
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
