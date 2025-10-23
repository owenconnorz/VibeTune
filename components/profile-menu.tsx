"use client"

import { useState } from "react"
import { SettingsIcon, Shield, Plus, RefreshCw, Puzzle } from "lucide-react"
import { signOut } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { X } from "lucide-react"
import Link from "next/link"

interface ProfileMenuProps {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  } | null
  isOpen: boolean
  onClose: () => void
}

export function ProfileMenu({ user, isOpen, onClose }: ProfileMenuProps) {
  const [moreContent, setMoreContent] = useState(true)
  const [autoSync, setAutoSync] = useState(true)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 animate-in fade-in duration-200">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">VibeTune</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-6 h-6" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* User Profile */}
          <div className="flex items-center justify-between bg-card rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-14 h-14">
                <AvatarImage src={user?.image || ""} alt={user?.name || "User"} />
                <AvatarFallback className="text-xl">{user?.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <h3 className="font-semibold text-xl">{user?.name || "User"}</h3>
            </div>
            {user ? (
              <Button
                variant="outline"
                className="rounded-full px-8 py-2 h-auto border-2 bg-transparent"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Log out
              </Button>
            ) : (
              <Button variant="outline" className="rounded-full px-8 py-2 h-auto border-2 bg-transparent" asChild>
                <Link href="/auth/signin">Sign in</Link>
              </Button>
            )}
          </div>

          {/* Token */}
          <button className="w-full flex items-center gap-4 bg-card rounded-2xl p-6 hover:bg-card/80 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <span className="font-medium text-lg">Tap to show token</span>
          </button>

          {/* More Content */}
          <div className="flex items-center justify-between bg-card rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                <Plus className="w-6 h-6" />
              </div>
              <span className="font-medium text-lg">More content</span>
            </div>
            <Switch checked={moreContent} onCheckedChange={setMoreContent} />
          </div>

          {/* Auto Sync */}
          <div className="flex items-center justify-between bg-card rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                <RefreshCw className="w-6 h-6" />
              </div>
              <span className="font-medium text-lg">Auto sync with account</span>
            </div>
            <Switch checked={autoSync} onCheckedChange={setAutoSync} />
          </div>

          {/* Integrations */}
          <button className="w-full flex items-center gap-4 bg-card rounded-2xl p-6 hover:bg-card/80 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
              <Puzzle className="w-6 h-6" />
            </div>
            <span className="font-medium text-lg">Integrations</span>
          </button>

          {/* Settings */}
          <Link href="/dashboard/settings" onClick={onClose}>
            <button className="w-full flex items-center gap-4 bg-card rounded-2xl p-6 hover:bg-card/80 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                <SettingsIcon className="w-6 h-6" />
              </div>
              <span className="font-medium text-lg">Settings</span>
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
