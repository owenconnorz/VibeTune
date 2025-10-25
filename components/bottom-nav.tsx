"use client"

import { Home, Search, Library, Sparkles } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function BottomNav() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return pathname === "/dashboard"
    }
    return pathname.startsWith(path)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-40 pb-safe">
      <div className="flex items-center justify-around h-20">
        <Link
          href="/dashboard"
          className={cn(
            "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
            isActive("/dashboard") && !pathname.includes("/discover") && !pathname.includes("/community")
              ? "text-foreground"
              : "text-muted-foreground",
          )}
        >
          <Home className="w-6 h-6" />
          <span className="text-xs font-medium">Home</span>
        </Link>
        <Link
          href="/dashboard/discover"
          className={cn(
            "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
            isActive("/dashboard/discover") ? "text-foreground" : "text-muted-foreground",
          )}
        >
          <Sparkles className="w-6 h-6" />
          <span className="text-xs font-medium">Discover</span>
        </Link>
        <Link
          href="/dashboard/search"
          className={cn(
            "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
            isActive("/dashboard/search") ? "text-foreground" : "text-muted-foreground",
          )}
        >
          <Search className="w-6 h-6" />
          <span className="text-xs font-medium">Search</span>
        </Link>
        <Link
          href="/dashboard/library"
          className={cn(
            "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
            isActive("/dashboard/library") ? "text-foreground" : "text-muted-foreground",
          )}
        >
          <Library className="w-6 h-6" />
          <span className="text-xs font-medium">Library</span>
        </Link>
      </div>
    </nav>
  )
}
