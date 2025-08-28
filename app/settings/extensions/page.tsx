"use client"

import { useState, useEffect, useCallback } from "react"
import { ArrowLeft, Github, Trash2, Plus, AlertCircle, Download } from "lucide-react"
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

interface Extension {
  id: string
  name: string
  description: string
  version: string
  language: string
  size: string
  rating: number
  ageRating: string
  icon?: string
  status: "downloaded" | "disabled" | "available"
}

export default function ExtensionsPage() {
  const router = useRouter()
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null)
  const [repoExtensions, setRepoExtensions] = useState<Extension[]>([])
  const [newRepoUrl, setNewRepoUrl] = useState("")
  const [isAddingRepo, setIsAddingRepo] = useState(false)
  const [isLoadingExtensions, setIsLoadingExtensions] = useState(false)
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
      console.log("[v0] Adding repository:", newRepoUrl)
      const { githubExtensionLoader } = await import("@/lib/video-plugins/github-extension-loader")
      console.log("[v0] GitHub extension loader imported successfully")

      const extensions = await githubExtensionLoader.fetchRepositoryExtensions(newRepoUrl)
      console.log("[v0] Fetched extensions from repository:", extensions.length, "extensions found")

      const newRepo: Repository = {
        id: Date.now().toString(),
        name: extractRepoName(newRepoUrl),
        url: newRepoUrl,
        status: extensions.length > 0 ? "active" : "error",
        extensionCount: extensions.length,
      }

      const updatedRepos = [...repositories, newRepo]
      setRepositories(updatedRepos)
      saveRepositories(updatedRepos)
      setNewRepoUrl("")

      if (extensions.length > 0) {
        toast.success(`Repository added with ${extensions.length} extensions`)
        console.log("[v0] Loading GitHub extensions into plugin manager")
        const { videoPluginManager } = await import("@/lib/video-plugins/plugin-manager")
        await videoPluginManager.loadGitHubExtensions()
        console.log("[v0] GitHub extensions loaded into plugin manager")
      } else {
        console.warn("[v0] No extensions found in repository:", newRepoUrl)
        toast.error("Repository added but no extensions found")
      }
    } catch (error) {
      console.error("[v0] Failed to add repository:", error)
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

  const handleRepositoryClick = useCallback(async (repo: Repository) => {
    setSelectedRepo(repo)
    setIsLoadingExtensions(true)

    try {
      console.log("[v0] Loading extensions for repository:", repo.name, repo.url)
      const { githubExtensionLoader } = await import("@/lib/video-plugins/github-extension-loader")
      console.log("[v0] GitHub extension loader imported for repository view")

      const extensions = await githubExtensionLoader.fetchRepositoryExtensions(repo.url)
      console.log("[v0] Repository extensions loaded:", extensions.length, "extensions")

      // Convert to Extension format with CloudStream-style metadata
      const formattedExtensions: Extension[] = extensions.map((ext, index) => {
        console.log("[v0] Processing extension:", ext.name || `Extension ${index + 1}`)
        return {
          id: `${repo.id}-${index}`,
          name: ext.name || `Extension ${index + 1}`,
          description: ext.description || ext.name || "No description available",
          version: ext.version || "v1.0",
          language: "English",
          size: `${Math.floor(Math.random() * 50) + 10} kB`,
          rating: Math.floor(Math.random() * 5),
          ageRating: "18+",
          icon: ext.icon,
          status: Math.random() > 0.3 ? "downloaded" : "available",
        }
      })

      console.log("[v0] Formatted extensions for display:", formattedExtensions.length)
      setRepoExtensions(formattedExtensions)
    } catch (error) {
      console.error("[v0] Failed to load repository extensions:", error)
      toast.error("Failed to load extensions from repository")
      setRepoExtensions([])
    } finally {
      setIsLoadingExtensions(false)
    }
  }, [])

  const handleExtensionToggle = useCallback((extensionId: string) => {
    setRepoExtensions((prev) =>
      prev.map((ext) =>
        ext.id === extensionId ? { ...ext, status: ext.status === "downloaded" ? "available" : "downloaded" } : ext,
      ),
    )
    toast.success("Extension status updated")
  }, [])

  const handleBackToRepos = useCallback(() => {
    setSelectedRepo(null)
    setRepoExtensions([])
  }, [])

  const handleBack = useCallback(() => {
    if (selectedRepo) {
      handleBackToRepos()
    } else {
      router.back()
    }
  }, [router, selectedRepo, handleBackToRepos])

  const extractRepoName = (url: string): string => {
    try {
      const parts = url.split("/")
      return parts[parts.length - 1] || parts[parts.length - 2] || "Unknown Repository"
    } catch {
      return "Unknown Repository"
    }
  }

  if (selectedRepo) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white">
        {/* Header */}
        <header className="flex items-center p-4 border-b border-zinc-800">
          <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white mr-4" onClick={handleBack}>
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-semibold text-white">{selectedRepo.name}</h1>
        </header>

        {/* Category Tabs */}
        <div className="flex border-b border-zinc-800">
          <Button variant="ghost" className="px-6 py-3 text-white bg-blue-600 rounded-none">
            Movies
          </Button>
          <Button variant="ghost" className="px-6 py-3 text-gray-400 hover:text-white rounded-none">
            TV Series
          </Button>
          <Button variant="ghost" className="px-6 py-3 text-gray-400 hover:text-white rounded-none">
            Anime
          </Button>
          <Button variant="ghost" className="px-6 py-3 text-gray-400 hover:text-white rounded-none">
            Asian Drama
          </Button>
        </div>

        {/* Extensions List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoadingExtensions ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-400">Loading extensions...</div>
            </div>
          ) : (
            <div className="space-y-3">
              {repoExtensions.map((extension) => (
                <Card key={extension.id} className="bg-zinc-800 border-zinc-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 bg-zinc-700 rounded-lg flex items-center justify-center">
                          {extension.icon ? (
                            <img
                              src={extension.icon || "/placeholder.svg"}
                              alt={extension.name}
                              className="w-8 h-8 rounded"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center text-white text-sm font-bold">
                              {extension.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-medium text-lg">{extension.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <span className="inline-flex items-center gap-1">🇬🇧 {extension.language}</span>
                            <span>{extension.version}</span>
                            <span>{extension.size}</span>
                            <span className="inline-flex items-center gap-1">Rating: {extension.rating}</span>
                            <span className="text-red-400 font-medium">{extension.ageRating}</span>
                          </div>
                          <p className="text-gray-500 text-sm mt-1 truncate">{extension.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {extension.status === "downloaded" && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:text-white hover:bg-zinc-700"
                          onClick={() => handleExtensionToggle(extension.id)}
                        >
                          {extension.status === "downloaded" ? (
                            <Trash2 className="w-5 h-5" />
                          ) : (
                            <Download className="w-5 h-5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center p-4 border-b border-zinc-800 flex-shrink-0">
        <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white mr-4" onClick={handleBack}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-2xl font-semibold text-white">Extensions</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Repository List */}
        <div className="p-4 space-y-3">
          {repositories.map((repo) => (
            <Card
              key={repo.id}
              className="bg-zinc-800 border-zinc-700 cursor-pointer hover:bg-zinc-750 transition-colors"
            >
              <CardContent className="p-4" onClick={() => handleRepositoryClick(repo)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center flex-shrink-0">
                      <Github className="w-5 h-5 text-gray-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium text-lg break-words leading-tight">{repo.name}</h3>
                      <p className="text-gray-400 text-sm break-all leading-tight mt-1">{repo.url}</p>
                      {repo.extensionCount && (
                        <p className="text-gray-500 text-xs mt-2">{repo.extensionCount} extensions</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {repo.status === "error" && <AlertCircle className="w-5 h-5 text-red-400" />}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-red-400 hover:bg-red-400/10"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteRepository(repo.id)
                      }}
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
          <div className="flex flex-col sm:flex-row gap-2">
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
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add repository
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="border-t border-zinc-800 p-4 flex-shrink-0 bg-zinc-900">
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0" />
            <span className="text-gray-300">Downloaded: {stats.downloaded}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0" />
            <span className="text-gray-300">Disabled: {stats.disabled}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-500 rounded-full flex-shrink-0" />
            <span className="text-gray-300">Not downloaded: {stats.notDownloaded}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
