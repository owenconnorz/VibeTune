"use client"

import { useState } from "react"
import { Clock, TrendingUp, Film, SearchIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ProfileMenu } from "@/components/profile-menu"
import Link from "next/link"

interface TopHeaderProps {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  } | null
  title: string
  showSearch?: boolean
}

export function TopHeader({ user, title, showSearch }: TopHeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 bg-background z-30 border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">{title}</h1>
            <div className="flex items-center gap-3">
              {showSearch && (
                <Link href="/dashboard/search">
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <SearchIcon className="w-6 h-6" />
                  </Button>
                </Link>
              )}
              <Link href="/dashboard/history">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Clock className="w-6 h-6" />
                </Button>
              </Link>
              <Link href="/movies">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Film className="w-6 h-6" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" className="rounded-full">
                <TrendingUp className="w-6 h-6" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full p-0" onClick={() => setIsProfileOpen(true)}>
                <Avatar className="w-10 h-10">
                  <AvatarImage src={user?.image || ""} alt={user?.name || "User"} />
                  <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
              </Button>
            </div>
          </div>
        </div>
      </header>
      <ProfileMenu user={user} isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  )
}
