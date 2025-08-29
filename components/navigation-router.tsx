"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Compass, Library, Play } from "lucide-react"

interface NavigationItem {
  id: string
  path: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  activeIcon: React.ComponentType<{ className?: string }>
}

const navigationItems: NavigationItem[] = [
  {
    id: "home",
    path: "/",
    label: "Home",
    icon: ({ className }) => (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"
          clipRule="evenodd"
        />
      </svg>
    ),
    activeIcon: ({ className }) => (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
      </svg>
    ),
  },
  {
    id: "explore",
    path: "/explore",
    label: "Explore",
    icon: Compass,
    activeIcon: ({ className }) => (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path
          fillRule="evenodd"
          d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    id: "library",
    path: "/library",
    label: "Library",
    icon: Library,
    activeIcon: ({ className }) => (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
      </svg>
    ),
  },
  {
    id: "videos",
    path: "/videos",
    label: "Videos",
    icon: Play,
    activeIcon: ({ className }) => (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M8 5v14l11-7z" />
      </svg>
    ),
  },
]

export function NavigationRouter() {
  const router = useRouter()
  const pathname = usePathname()
  const [activeRoute, setActiveRoute] = useState(pathname)

  useEffect(() => {
    setActiveRoute(pathname)
  }, [pathname])

  const handleNavigation = (item: NavigationItem, event: React.MouseEvent) => {
    event.preventDefault()

    // Don't navigate if already on the same route
    if (activeRoute === item.path) return

    // Update browser history and navigate
    setActiveRoute(item.path)
    router.push(item.path)

    // Update document title
    const pageTitle = item.label === "Home" ? "VibeTune Music App" : `${item.label} - VibeTune`
    document.title = pageTitle
  }

  const visibleItems = navigationItems

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-md border-t border-zinc-700 z-50 shadow-2xl">
      <div className="flex items-center justify-around py-2">
        {visibleItems.map((item) => {
          const isActive = activeRoute === item.path
          const IconComponent = isActive ? item.activeIcon : item.icon

          return (
            <button
              key={item.id}
              onClick={(e) => handleNavigation(item, e)}
              className="flex flex-col items-center py-2 px-3 transition-all duration-200 hover:bg-zinc-800/50 rounded-lg"
            >
              <div
                className={`mb-1 transition-all duration-200 ${isActive ? "bg-yellow-500 rounded-full p-2" : "p-2"}`}
              >
                <IconComponent className={`w-5 h-5 ${isActive ? "text-black" : "text-gray-400 hover:text-gray-300"}`} />
              </div>
              <span
                className={`text-[10px] transition-colors duration-200 ${isActive ? "text-white font-medium" : "text-gray-400"}`}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
