"use client"

import { useState } from "react"
import { Search, ArrowLeft, Globe } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function SearchContent() {
  const [query, setQuery] = useState("")
  const router = useRouter()

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 bg-background z-30 border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search YouTube Music..."
                className="pl-10 bg-secondary border-0 h-12 rounded-full"
              />
            </div>
            <Button variant="ghost" size="icon">
              <Globe className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-96 text-muted-foreground">
          <p>Start typing to search for music...</p>
        </div>
      </div>
    </div>
  )
}
