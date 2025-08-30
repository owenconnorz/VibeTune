"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { ArrowLeft, Github, Trash2, Plus, AlertCircle, Download, Edit2, Check, X } from "lucide-react"
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
  const [renamingRepoId, setRenamingRepoId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [stats, setStats] = useState({
    downloaded: 0,
    disabled: 0,
    notDownloaded: 0,
  })

  useEffect(() => {
    const loadRepositories = () => {
      try {
        console.log("[v0] ==> LOADING REPOSITORIES FROM LOCALSTORAGE")
        const saved = localStorage.getItem("vibetuneExtensionRepos")
        console.log("[v0] Raw localStorage data:", saved)

        if (saved) {
          const repos = JSON.parse(saved)
          console.log("[v0] Parsed repositories:", repos)
          console.log("[v0] Repository count:", repos.length)
          setRepositories(repos)
          updateStats(repos)
        } else {
          console.log("[v0] No repositories found in localStorage")
          setRepositories([])
          updateStats([])
        }
      } catch (error) {
        console.error("[v0] Failed to load repositories:", error)
        setRepositories([])
        updateStats([])
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
      console.log("[v0] ==> STARTING REPOSITORY ADD PROCESS")
      console.log("[v0] Adding repository:", newRepoUrl)
      console.log("[v0] Current repositories count:", repositories.length)

      console.log("[v0] Testing network connectivity...")
      const testResponse = await fetch("https://api.github.com", { method: "HEAD" })
      console.log("[v0] GitHub API connectivity test:", testResponse.status)

      const { githubExtensionLoader } = await import("@/lib/video-plugins/github-extension-loader")
      console.log("[v0] GitHub extension loader imported successfully")

      console.log("[v0] ==> CALLING fetchRepositoryExtensions WITH ENHANCED LOGGING")
      console.log("[v0] Repository URL being processed:", newRepoUrl)
      console.log("[v0] Expected CloudStream manifest format check starting...")

      const extensions = await githubExtensionLoader.fetchRepositoryExtensions(newRepoUrl)

      console.log("[v0] ==> FETCH COMPLETE - Extensions found:", extensions.length)
      console.log("[v0] ==> RAW EXTENSION DATA DUMP:")
      extensions.forEach((ext, index) => {
        console.log(`[v0] Extension ${index + 1}:`, {
          name: ext.name,
          url: ext.url,
          description: ext.description,
          version: ext.version,
          type: ext.type,
          language: ext.language,
          fullObject: ext,
        })
      })

      if (extensions.length === 0) {
        console.log("[v0] ==> ZERO EXTENSIONS FOUND - INVESTIGATING MANIFEST STRUCTURE")
        console.log("[v0] Attempting direct manifest fetch for analysis...")
        try {
          const directResponse = await fetch(newRepoUrl)
          const manifestText = await directResponse.text()
          console.log("[v0] ==> DIRECT MANIFEST CONTENT:")
          console.log(manifestText.substring(0, 1000) + (manifestText.length > 1000 ? "..." : ""))

          const manifestJson = JSON.parse(manifestText)
          console.log("[v0] ==> PARSED MANIFEST STRUCTURE:")
          console.log("Keys:", Object.keys(manifestJson))
          console.log("Is Array:", Array.isArray(manifestJson))
          if (Array.isArray(manifestJson)) {
            console.log("Array length:", manifestJson.length)
            console.log("First item keys:", manifestJson[0] ? Object.keys(manifestJson[0]) : "No items")
          }
        } catch (manifestError) {
          console.error("[v0] Failed to analyze manifest directly:", manifestError)
        }
      }

      const newRepo: Repository = {
        id: Date.now().toString(),
        name: extractRepoName(newRepoUrl),
        url: newRepoUrl,
        status: extensions.length > 0 ? "active" : "error",
        extensionCount: extensions.length,
      }

      console.log("[v0] Created new repository object:", newRepo)

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
        console.warn("[v0] ==> NO EXTENSIONS FOUND IN REPOSITORY:", newRepoUrl)
        toast.error("Repository added but no extensions found - check console for manifest analysis")
      }
    } catch (error) {
      console.error("[v0] ==> REPOSITORY ADD FAILED:", error)
      console.error("[v0] Error details:", error.message, error.stack)
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        console.error("[v0] Network error - check CORS and connectivity")
      }
      toast.error(`Failed to add repository: ${error.message}`)
    } finally {
      setIsAddingRepo(false)
      console.log("[v0] ==> REPOSITORY ADD PROCESS COMPLETE")
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
    console.log("[v0] ==> REPOSITORY CLICKED:", repo.name, repo.url)
    setSelectedRepo(repo)
    setIsLoadingExtensions(true)

    try {
      console.log("[v0] ==> STARTING EXTENSION LOAD FOR REPOSITORY")
      console.log("[v0] Loading extensions for repository:", repo.name, repo.url)

      const { githubExtensionLoader } = await import("@/lib/video-plugins/github-extension-loader")
      console.log("[v0] GitHub extension loader imported for repository view")

      console.log("[v0] ==> CALLING fetchRepositoryExtensions FOR DETAIL VIEW WITH ENHANCED LOGGING")
      console.log("[v0] Repository being analyzed:", repo.url)

      const extensions = await githubExtensionLoader.fetchRepositoryExtensions(repo.url)

      console.log("[v0] ==> DETAIL VIEW FETCH COMPLETE - Extensions loaded:", extensions.length)
      console.log("[v0] ==> DETAILED EXTENSION ANALYSIS:")
      extensions.forEach((ext, index) => {
        console.log(`[v0] Detail Extension ${index + 1}:`, {
          name: ext.name || `Unnamed Extension ${index + 1}`,
          description: ext.description || "No description",
          version: ext.version || "Unknown version",
          url: ext.url,
          type: ext.type || "Unknown type",
          language: ext.language || "Unknown language",
          hasIcon: !!ext.icon,
          allProperties: Object.keys(ext),
        })
      })

      const formattedExtensions: Extension[] = extensions.map((ext, index) => {
        console.log("[v0] Processing extension for display:", ext.name || `Extension ${index + 1}`, ext)
        return {
          id: `${repo.id}-${index}`,
          name: ext.name || `Extension ${index + 1}`,
          description: ext.description || ext.name || "No description available",
          version: ext.version || "v1.0",
          language: ext.language || "English",
          size: `${Math.floor(Math.random() * 50) + 10} kB`,
          rating: Math.floor(Math.random() * 5),
          ageRating: "18+",
          icon: ext.icon,
          status: Math.random() > 0.3 ? "downloaded" : "available",
        }
      })

      console.log("[v0] ==> FORMATTED EXTENSIONS FOR DISPLAY:", formattedExtensions.length)
      console.log(
        "[v0] Formatted extension names:",
        formattedExtensions.map((ext) => ext.name),
      )
      setRepoExtensions(formattedExtensions)
    } catch (error) {
      console.error("[v0] ==> REPOSITORY EXTENSION LOAD FAILED:", error)
      console.error("[v0] Error details:", error.message, error.stack)
      toast.error("Failed to load extensions from repository")
      setRepoExtensions([])
    } finally {
      setIsLoadingExtensions(false)
      console.log("[v0] ==> REPOSITORY EXTENSION LOAD COMPLETE")
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

  const handleStartRename = useCallback((repo: Repository, e: React.MouseEvent) => {
    e.stopPropagation()
    setRenamingRepoId(repo.id)
    setRenameValue(repo.name)
  }, [])

  const handleSaveRename = useCallback(
    (repoId: string) => {
      if (!renameValue.trim()) return

      const updatedRepos = repositories.map((repo) =>
        repo.id === repoId ? { ...repo, name: renameValue.trim() } : repo,
      )
      setRepositories(updatedRepos)
      saveRepositories(updatedRepos)
      setRenamingRepoId(null)
      setRenameValue("")
      toast.success("Repository renamed successfully")
    },
    [repositories, renameValue],
  )

  const handleCancelRename = useCallback(() => {
    setRenamingRepoId(null)
    setRenameValue("")
  }, [])

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
          {repositories.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-2">No repositories added yet</p>
              <p className="text-gray-500 text-sm">Add a CloudStream repository URL below to get started</p>
            </div>
          )}

          {repositories.map((repo) => (
            <Card
              key={repo.id}
              className="bg-zinc-800 border-zinc-700 cursor-pointer hover:bg-zinc-750 transition-colors"
            >
              <CardContent className="p-4" onClick={() => renamingRepoId !== repo.id && handleRepositoryClick(repo)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center flex-shrink-0">
                      <Github className="w-5 h-5 text-gray-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {renamingRepoId === repo.id ? (
                        <div className="flex items-center gap-2 mb-2">
                          <Input
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            className="flex-1 bg-zinc-700 border-zinc-600 text-white text-lg font-medium"
                            onKeyPress={(e) => {
                              if (e.key === "Enter") handleSaveRename(repo.id)
                              if (e.key === "Escape") handleCancelRename()
                            }}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-green-400 hover:text-green-300 hover:bg-green-400/10"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSaveRename(repo.id)
                            }}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-400 hover:text-gray-300 hover:bg-gray-400/10"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCancelRename()
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <h3 className="text-white font-medium text-lg break-words leading-tight">{repo.name}</h3>
                      )}
                      <p className="text-gray-400 text-sm break-all leading-tight mt-1">{repo.url}</p>
                      {repo.extensionCount !== undefined && (
                        <p className="text-gray-500 text-xs mt-2">
                          {repo.extensionCount} extension{repo.extensionCount !== 1 ? "s" : ""}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            repo.status === "active"
                              ? "bg-green-500"
                              : repo.status === "disabled"
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                        />
                        <span className="text-xs text-gray-500 capitalize">{repo.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {repo.status === "error" && <AlertCircle className="w-5 h-5 text-red-400" />}
                    {renamingRepoId !== repo.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-blue-400 hover:bg-blue-400/10"
                        onClick={(e) => handleStartRename(repo, e)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    )}
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
