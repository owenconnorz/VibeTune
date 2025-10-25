"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Search, X } from "lucide-react"
import { useRouter } from "next/navigation"

export function SearchBar() {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const router = useRouter()
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.trim().length > 0) {
        try {
          const response = await fetch(
            `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}`,
          )
          const data = await response.json()
          setSuggestions(data[1] || [])
          setShowSuggestions(true)
        } catch (error) {
          console.error("Error fetching suggestions:", error)
          setSuggestions([])
        }
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }

    const debounce = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(debounce)
  }, [query])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      router.push(`/dashboard/search?q=${encodeURIComponent(searchQuery)}`)
      setShowSuggestions(false)
      setQuery("")
      inputRef.current?.blur()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (selectedIndex >= 0) {
        handleSearch(suggestions[selectedIndex])
      } else {
        handleSearch(query)
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false)
      inputRef.current?.blur()
    }
  }

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim() && setShowSuggestions(true)}
          placeholder="Search for songs, artists, albums..."
          className="h-10 w-full rounded-full border border-border bg-background pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("")
              setSuggestions([])
              setShowSuggestions(false)
              inputRef.current?.focus()
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full z-50 mt-2 w-full rounded-lg border border-border bg-background shadow-lg">
          <div className="max-h-96 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSearch(suggestion)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-accent ${
                  index === selectedIndex ? "bg-accent" : ""
                }`}
              >
                <Search className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1">{suggestion}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
