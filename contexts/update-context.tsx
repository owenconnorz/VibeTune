"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { githubAPI, type GitHubCommit, type GitHubRelease } from "@/lib/github-api"

interface UpdateContextType {
  hasUpdates: boolean
  newCommits: GitHubCommit[]
  latestRelease: GitHubRelease | null
  lastChecked: Date | null
  isChecking: boolean
  currentVersion: string
  checkForUpdates: () => Promise<void>
  markAsViewed: () => void
  setRepository: (owner: string, repo: string) => void
}

const UpdateContext = createContext<UpdateContextType | undefined>(undefined)

const STORAGE_KEYS = {
  LAST_CHECKED: "vibetune_last_update_check",
  LAST_COMMIT_SHA: "vibetune_last_commit_sha",
  CURRENT_VERSION: "vibetune_current_version",
  VIEWED_COMMITS: "vibetune_viewed_commits",
}

// Default current version - should be updated when deploying
const DEFAULT_VERSION = "1.0.0"

export function UpdateProvider({ children }: { children: React.ReactNode }) {
  const [hasUpdates, setHasUpdates] = useState(false)
  const [newCommits, setNewCommits] = useState<GitHubCommit[]>([])
  const [latestRelease, setLatestRelease] = useState<GitHubRelease | null>(null)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [currentVersion, setCurrentVersion] = useState(DEFAULT_VERSION)

  // Load stored data on mount
  useEffect(() => {
    const storedLastChecked = localStorage.getItem(STORAGE_KEYS.LAST_CHECKED)
    const storedVersion = localStorage.getItem(STORAGE_KEYS.CURRENT_VERSION)

    if (storedLastChecked) {
      setLastChecked(new Date(storedLastChecked))
    }
    if (storedVersion) {
      setCurrentVersion(storedVersion)
    }
  }, [])

  const checkForUpdates = useCallback(async () => {
    if (isChecking) return

    setIsChecking(true)
    try {
      // Get latest commits
      const commits = await githubAPI.getCommits(20)
      const release = await githubAPI.getLatestRelease()

      if (commits.length > 0) {
        const lastCommitSha = localStorage.getItem(STORAGE_KEYS.LAST_COMMIT_SHA)
        const viewedCommits = JSON.parse(localStorage.getItem(STORAGE_KEYS.VIEWED_COMMITS) || "[]")

        // Find new commits since last check
        let newCommitsList: GitHubCommit[] = []
        if (lastCommitSha) {
          const lastCommitIndex = commits.findIndex((commit) => commit.sha === lastCommitSha)
          if (lastCommitIndex > 0) {
            newCommitsList = commits.slice(0, lastCommitIndex)
          }
        } else {
          // First time checking - show last 5 commits as "new"
          newCommitsList = commits.slice(0, 5)
        }

        // Filter out already viewed commits
        const unviewedCommits = newCommitsList.filter((commit) => !viewedCommits.includes(commit.sha))

        setNewCommits(unviewedCommits)
        setHasUpdates(unviewedCommits.length > 0)
        setLatestRelease(release)

        // Update last checked time
        const now = new Date()
        setLastChecked(now)
        localStorage.setItem(STORAGE_KEYS.LAST_CHECKED, now.toISOString())

        // Store latest commit SHA if we have commits
        if (commits.length > 0) {
          localStorage.setItem(STORAGE_KEYS.LAST_COMMIT_SHA, commits[0].sha)
        }
      }
    } catch (error) {
      console.error("Failed to check for updates:", error)
    } finally {
      setIsChecking(false)
    }
  }, [isChecking])

  const markAsViewed = useCallback(() => {
    const viewedCommits = JSON.parse(localStorage.getItem(STORAGE_KEYS.VIEWED_COMMITS) || "[]")
    const newViewedCommits = [...viewedCommits, ...newCommits.map((commit) => commit.sha)]
    localStorage.setItem(STORAGE_KEYS.VIEWED_COMMITS, JSON.stringify(newViewedCommits))

    setHasUpdates(false)
    setNewCommits([])
  }, [newCommits])

  const setRepository = useCallback((owner: string, repo: string) => {
    githubAPI.setRepository(owner, repo)
    // Clear stored data when repository changes
    localStorage.removeItem(STORAGE_KEYS.LAST_COMMIT_SHA)
    localStorage.removeItem(STORAGE_KEYS.VIEWED_COMMITS)
    setHasUpdates(false)
    setNewCommits([])
  }, [])

  // Auto-check for updates every 30 minutes
  useEffect(() => {
    const interval = setInterval(
      () => {
        checkForUpdates()
      },
      30 * 60 * 1000,
    ) // 30 minutes

    // Initial check after 5 seconds
    const timeout = setTimeout(() => {
      checkForUpdates()
    }, 5000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [checkForUpdates])

  const value: UpdateContextType = {
    hasUpdates,
    newCommits,
    latestRelease,
    lastChecked,
    isChecking,
    currentVersion,
    checkForUpdates,
    markAsViewed,
    setRepository,
  }

  return <UpdateContext.Provider value={value}>{children}</UpdateContext.Provider>
}

export function useUpdates() {
  const context = useContext(UpdateContext)
  if (context === undefined) {
    throw new Error("useUpdates must be used within an UpdateProvider")
  }
  return context
}
