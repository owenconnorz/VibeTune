"use client"

import { useState, useEffect } from "react"
import { Clock, TrendingUp } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ProfileMenu } from "@/components/profile-menu"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { useScrollDirection } from "@/hooks/use-scroll-direction"

interface TopHeaderProps {
  title: string
}

export function TopHeader({ title }: TopHeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [customProfilePicture, setCustomProfilePicture] = useState<string | null>(null)
  const scrollDirection = useScrollDirection()
  const [isVisible, setIsVisible] = useState(true)

  const sessionResult = useSession()
  const session = sessionResult?.data ?? null
  const status = sessionResult?.status ?? "unauthenticated"

  const user = session?.user

  useEffect(() => {
    if (scrollDirection === "down") {
      setIsVisible(false)
    } else if (scrollDirection === "up") {
      setIsVisible(true)
    }
  }, [scrollDirection])

  useEffect(() => {
    const loadCustomPicture = () => {
      const customPicture = localStorage.getItem("customProfilePicture")
      setCustomProfilePicture(customPicture)
    }

    loadCustomPicture()

    const handleProfilePictureChange = (event: CustomEvent) => {
      setCustomProfilePicture(event.detail)
    }

    window.addEventListener("profilePictureChanged", handleProfilePictureChange as EventListener)

    return () => {
      window.removeEventListener("profilePictureChanged", handleProfilePictureChange as EventListener)
    }
  }, [])

  const profileImage = customProfilePicture || user?.image || ""

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 bg-background z-40 border-b border-border/50 transition-transform duration-300 ${
          isVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">{title}</h1>
            <div className="flex items-center gap-3">
              <Link href="/dashboard/history">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Clock className="w-6 h-6" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" className="rounded-full">
                <TrendingUp className="w-6 h-6" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full p-0" onClick={() => setIsProfileOpen(true)}>
                <Avatar className="w-10 h-10">
                  <AvatarImage src={profileImage || "/placeholder.svg"} alt={user?.name || "User"} />
                  <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
              </Button>
            </div>
          </div>
        </div>
      </header>
      <div className="h-[72px]" />
      <ProfileMenu user={user} isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </>
  )
}
