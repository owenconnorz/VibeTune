"use client"

import {
  ArrowLeft,
  Palette,
  Play,
  Globe,
  Shield,
  HardDrive,
  Cloud,
  LinkIcon,
  RefreshCw,
  Info,
  Server,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function SettingsContent() {
  const router = useRouter()

  const sections = [
    {
      title: "Interface",
      items: [{ icon: Palette, label: "Appearance", href: "/dashboard/settings/appearance" }],
    },
    {
      title: "Player & Content",
      items: [
        { icon: Play, label: "Player and audio" },
        { icon: Globe, label: "Content" },
      ],
    },
    {
      title: "Privacy & Security",
      items: [
        { icon: Shield, label: "Privacy" },
        { icon: Shield, label: "Permissions", href: "/dashboard/settings/permissions" },
      ],
    },
    {
      title: "Storage & Data",
      items: [
        { icon: HardDrive, label: "Storage" },
        { icon: Cloud, label: "Backup and restore" },
      ],
    },
    {
      title: "System & About",
      items: [
        { icon: Server, label: "API Settings", href: "/dashboard/settings/api" },
        { icon: LinkIcon, label: "Open supported links" },
        { icon: RefreshCw, label: "Updater" },
        { icon: Info, label: "About" },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background z-30 border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-2xl font-bold">Settings</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-8 max-w-2xl">
        {sections.map((section) => (
          <div key={section.title} className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground px-2">{section.title}</h2>
            <div className="space-y-2">
              {section.items.map((item) => (
                <button
                  key={item.label}
                  onClick={() => item.href && router.push(item.href)}
                  className="w-full flex items-center gap-4 bg-card rounded-2xl p-4 hover:bg-card/80 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
