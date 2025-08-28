"use client"

import { useState, useEffect, useCallback } from "react"
import { ArrowLeft, Github, Trash2, Plus, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Repository {
  id: string
  name: string
  url: string
  status: "active" | "disabled" | "error"
  extensionCount?: number
}

export default function ExtensionsPage() {
  const router = useRouter()
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [newRepoUrl, setNewRepoUrl] = useState("")
  const [isAddingRepo, setIsAddingRepo] = useState(false)
  const [stats, setStats] = useState({
    downloaded: 0,
    disabled: 0,
    notDownloaded: 0,
  })

  // Load repositories from localStorage on mount
  useEffect(() => {
    const loadRepositories = () => {
      try {
        const saved = localStorage.getItem("vibetuneExtensionRepos")
        if (saved) {
          const repos = JSON.parse(saved)
          setRepositories(repos)
          updateStats(repos)
        } else {
          // Initialize with default CloudStream-style repositories
          const defaultRepos: Repository[] = [
            {
              id: "1",
              name: "Mega",
              url: "https://raw.githubusercontent.com/self...",
              status: "active",
              extensionCount: 25,
            },
            {
              id: "2",
              name: "Cloudstream providers repository",
              url: "https://raw.githubusercontent.com/recl...",
              status: "active",
              extensionCount: 150,
            },
            {
              id: "3",
              name: "Aniyomi Compat",
              url: "https://raw.githubusercontent.com/Cra...",
              status: "active",
              extensionCount: 45,
            },
            {
              id: "4",
              name: "Italian providers repository",
              url: "https://raw.githubusercontent.com/Gia...",
              status: "active",
              extensionCount: 30,
            },
            {
              id: "5",
              name: "(OLD) English providers repository",
              url: "https://codeberg.org/cloudstream/clou...",
              status: "disabled",
              extensionCount: 89,
            },
            {
              id: "6",
              name: "Multilingual providers repository",
              url: "https://codeberg.org/cloudstream/clou...",
              status: "active",
              extensionCount: 65,
            },
            {
              id: "7",
              name: "Hexated providers repository",
              url: "https://codeberg.org/cloudstream/clou...",
              status: "active",
              extensionCount: 78,
            },
            {
              id: "8",
              name: "LikDev-256 Pro Repository",
              url: "https://codeberg.org/cloudstream/likde...",
              status: "active",
              extensionCount: 12,
            },
          ]
          setRepositories(defaultRepos)
          updateStats(defaultRepos)
          localStorage.setItem("vibetuneExtensionRepos", JSON.stringify(defaultRepos))
        }
      } catch (error) {
        console.error("Failed to load repositories:", error)
      }
    }

    loadRepositories()
  }, [])

  const updateStats = (repos: Repository[]) => {
    const downloaded = repos.filter((r) => r.status === "active").reduce((sum, r) => sum + (r.extensionCount || 0), 0)
    const disabled = repos.filter((r) => r.status === "disabled").reduce((sum, r) => sum + (r.extensionCount || 0), 0)
    const notDownloaded = repos.filter((r) => r.status === "error").reduce((sum, r) => sum + (r.extensionCount || 0), 0)

    setStats({ downloaded, disabled, notDownloaded })
  }

  const saveRepositories = (repos: Repository[]) => {
    try {
      localStorage.setItem("vibetuneExtensionRepos", JSON.stringify(repos))
      updateStats(repos)
    } catch (error) {
      console.error("Failed to save repositories:", error)
    }
  }

  const handleAddRepository = useCallback(async () => {
    if (!newRepoUrl.trim()) return

    setIsAddingRepo(true)
    try {
      // Simulate repository validation
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const newRepo: Repository = {
        id: Date.now().toString(),
        name: extractRepoName(newRepoUrl),
        url: newRepoUrl,
        status: "active",
        extensionCount: Math.floor(Math.random() * 50) + 10,
      }

      const updatedRepos = [...repositories, newRepo]
      setRepositories(updatedRepos)
      saveRepositories(updatedRepos)
      setNewRepoUrl("")
      toast.success("Repository added successfully")
    } catch (error) {
      toast.error("Failed to add repository")
    } finally {
      setIsAddingRepo(false)
    }
  }, [newRepoUrl, repositories])

  const handleDeleteRepository = useCallback(
    (id: string) => {
      const updatedRepos = repositories.filter((repo) => repo.id !== id)
      setRepositories(updatedRepos)
      saveRepositories(updatedRepos)
      toast.success("Repository removed")
    },
    [repositories],
  )

  const extractRepoName = (url: string): string => {
    try {
      const parts = url.split("/")
      return parts[parts.length - 1] || parts[parts.length - 2] || "Unknown Repository"
    } catch {
      return "Unknown Repository"
    }
  }

  const handleBack = useCallback(() => {
    router.back()
  }, [router])

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Header */}
      <header className="flex items-center p-4 border-b border-zinc-800">
        <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white mr-4" onClick={handleBack}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-2xl font-semibold text-white">Extensions</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Repository List */}
        <div className="p-4 space-y-3">
          {repositories.map((repo) => (
            <Card key={repo.id} className="bg-zinc-800 border-zinc-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center">
                      <Github className="w-5 h-5 text-gray-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium text-lg truncate">{repo.name}</h3>
                      <p className="text-gray-400 text-sm truncate">{repo.url}</p>
                      {repo.extensionCount && (
                        <p className="text-gray-500 text-xs mt-1">{repo.extensionCount} extensions</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {repo.status === "error" && <AlertCircle className="w-5 h-5 text-red-400" />}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-red-400 hover:bg-red-400/10"
                      onClick={() => handleDeleteRepository(repo.id)}
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add Repository Section */}
        <div className="p-4 border-t border-zinc-800">
          <div className="flex gap-2">
            <Input
              placeholder="Repository URL"
              value={newRepoUrl}
              onChange={(e) => setNewRepoUrl(e.target.value)}
              className="flex-1 bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-400"
              onKeyPress={(e) => e.key === "Enter" && handleAddRepository()}
            />
            <Button
              onClick={handleAddRepository}
              disabled={!newRepoUrl.trim() || isAddingRepo}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add repository
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="border-t border-zinc-800 p-4">
        <div className="mb-4">
          <h3 className="text-white font-medium mb-2">Extensions</h3>
          <div className="w-full bg-zinc-700 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(stats.downloaded / (stats.downloaded + stats.disabled + stats.notDownloaded)) * 100 || 0}%`,
              }}
            />
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-gray-300">Downloaded: {stats.downloaded}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            <span className="text-gray-300">Disabled: {stats.disabled}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-500 rounded-full" />
            <span className="text-gray-300">Not downloaded: {stats.notDownloaded}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
