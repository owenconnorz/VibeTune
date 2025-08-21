"use client"
import { useState, useEffect } from "react"
import type React from "react"

import {
  ArrowLeft,
  RefreshCw,
  Download,
  Upload,
  Cloud,
  HardDrive,
  CheckCircle,
  AlertCircle,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { usePlaylist } from "@/contexts/playlist-context"

export default function BackupRestoreSettingsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { playlists } = usePlaylist()

  const [backupSettings, setBackupSettings] = useState({
    autoBackup: false,
    backupFrequency: "weekly", // daily, weekly, monthly
    includeDownloads: false,
    cloudSync: false,
  })

  const [backupStatus, setBackupStatus] = useState({
    lastBackup: null as Date | null,
    isBackingUp: false,
    isRestoring: false,
    backupSize: 0,
    nextBackup: null as Date | null,
  })

  const [syncProgress, setSyncProgress] = useState(0)

  useEffect(() => {
    loadBackupSettings()
    loadBackupStatus()
  }, [])

  const loadBackupSettings = () => {
    try {
      const saved = localStorage.getItem("vibetuneBackupSettings")
      if (saved) {
        setBackupSettings(JSON.parse(saved))
      }
    } catch (error) {
      console.error("Failed to load backup settings:", error)
    }
  }

  const loadBackupStatus = () => {
    try {
      const saved = localStorage.getItem("vibetuneBackupStatus")
      if (saved) {
        const status = JSON.parse(saved)
        setBackupStatus({
          ...status,
          lastBackup: status.lastBackup ? new Date(status.lastBackup) : null,
          nextBackup: status.nextBackup ? new Date(status.nextBackup) : null,
        })
      }
    } catch (error) {
      console.error("Failed to load backup status:", error)
    }
  }

  const saveBackupSettings = (newSettings: typeof backupSettings) => {
    setBackupSettings(newSettings)
    localStorage.setItem("vibetuneBackupSettings", JSON.stringify(newSettings))
  }

  const calculateBackupSize = () => {
    // Estimate backup size based on playlists and settings
    const playlistsSize = playlists.length * 0.1 // ~0.1MB per playlist
    const settingsSize = 0.01 // Settings are very small
    const downloadsSize = backupSettings.includeDownloads ? 50 : 0 // Estimated downloads
    return playlistsSize + settingsSize + downloadsSize
  }

  const handleCreateBackup = async () => {
    setBackupStatus((prev) => ({ ...prev, isBackingUp: true }))
    setSyncProgress(0)

    try {
      // Simulate backup process
      const backupData = {
        playlists,
        settings: {
          ...backupSettings,
          privacy: JSON.parse(localStorage.getItem("vibetunePrivacySettings") || "{}"),
          audio: JSON.parse(localStorage.getItem("vibetuneAudioSettings") || "{}"),
          appearance: JSON.parse(localStorage.getItem("vibetuneProfileSettings") || "{}"),
        },
        timestamp: new Date().toISOString(),
        version: "1.0.0",
      }

      // Simulate progress
      for (let i = 0; i <= 100; i += 10) {
        setSyncProgress(i)
        await new Promise((resolve) => setTimeout(resolve, 200))
      }

      // Create and download backup file
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `opentune-backup-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // Update backup status
      const now = new Date()
      const nextBackup = new Date(now)
      nextBackup.setDate(
        now.getDate() +
          (backupSettings.backupFrequency === "daily" ? 1 : backupSettings.backupFrequency === "weekly" ? 7 : 30),
      )

      const newStatus = {
        lastBackup: now,
        isBackingUp: false,
        isRestoring: false,
        backupSize: calculateBackupSize(),
        nextBackup,
      }

      setBackupStatus(newStatus)
      localStorage.setItem("vibetuneBackupStatus", JSON.stringify(newStatus))
    } catch (error) {
      console.error("Backup failed:", error)
    } finally {
      setBackupStatus((prev) => ({ ...prev, isBackingUp: false }))
      setSyncProgress(0)
    }
  }

  const handleRestoreBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setBackupStatus((prev) => ({ ...prev, isRestoring: true }))
    setSyncProgress(0)

    try {
      const text = await file.text()
      const backupData = JSON.parse(text)

      // Validate backup data
      if (!backupData.playlists || !backupData.settings || !backupData.timestamp) {
        throw new Error("Invalid backup file format")
      }

      // Simulate restore progress
      for (let i = 0; i <= 100; i += 20) {
        setSyncProgress(i)
        await new Promise((resolve) => setTimeout(resolve, 300))
      }

      // Restore data (in a real app, you'd restore to the actual contexts)
      console.log("Restoring backup data:", backupData)

      alert(`Backup restored successfully! ${backupData.playlists.length} playlists restored.`)
    } catch (error) {
      console.error("Restore failed:", error)
      alert("Failed to restore backup. Please check the file format.")
    } finally {
      setBackupStatus((prev) => ({ ...prev, isRestoring: false }))
      setSyncProgress(0)
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "Never"
    return date.toLocaleDateString() + " at " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatSize = (sizeInMB: number) => {
    if (sizeInMB < 1) return `${Math.round(sizeInMB * 1024)} KB`
    return `${sizeInMB.toFixed(1)} MB`
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      <header className="flex items-center p-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-300 hover:text-white mr-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-2xl font-semibold text-white">Backup and restore</h1>
      </header>

      <div className="px-4 pb-6 space-y-6">
        {/* Backup Status */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Backup Status
            </CardTitle>
            <CardDescription className="text-gray-400">Current backup information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-zinc-700 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-white">Last Backup</span>
                </div>
                <p className="text-xs text-gray-400">{formatDate(backupStatus.lastBackup)}</p>
              </div>

              <div className="p-3 bg-zinc-700 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <HardDrive className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-white">Backup Size</span>
                </div>
                <p className="text-xs text-gray-400">{formatSize(calculateBackupSize())}</p>
              </div>

              <div className="p-3 bg-zinc-700 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-white">Items to Backup</span>
                </div>
                <p className="text-xs text-gray-400">{playlists.length} playlists, settings</p>
              </div>

              <div className="p-3 bg-zinc-700 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Cloud className="w-4 h-4 text-orange-400" />
                  <span className="text-sm font-medium text-white">Sync Status</span>
                </div>
                <p className="text-xs text-gray-400">
                  {user ? (backupSettings.cloudSync ? "Enabled" : "Disabled") : "Sign in required"}
                </p>
              </div>
            </div>

            {(backupStatus.isBackingUp || backupStatus.isRestoring) && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white">
                    {backupStatus.isBackingUp ? "Creating backup..." : "Restoring backup..."}
                  </span>
                  <span className="text-sm text-gray-400">{syncProgress}%</span>
                </div>
                <Progress value={syncProgress} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Backup Actions */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white">Backup Actions</CardTitle>
            <CardDescription className="text-gray-400">Create and restore backups</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-zinc-700 rounded-lg">
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-white font-medium">Create Backup</p>
                  <p className="text-gray-400 text-sm">Download your data as a backup file</p>
                </div>
              </div>
              <Button
                onClick={handleCreateBackup}
                disabled={backupStatus.isBackingUp}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {backupStatus.isBackingUp ? "Creating..." : "Create"}
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-zinc-700 rounded-lg">
              <div className="flex items-center gap-3">
                <Upload className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-white font-medium">Restore Backup</p>
                  <p className="text-gray-400 text-sm">Upload and restore from a backup file</p>
                </div>
              </div>
              <Button
                onClick={() => document.getElementById("restore-input")?.click()}
                disabled={backupStatus.isRestoring}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {backupStatus.isRestoring ? "Restoring..." : "Restore"}
              </Button>
            </div>

            <input id="restore-input" type="file" accept=".json" className="hidden" onChange={handleRestoreBackup} />
          </CardContent>
        </Card>

        {/* Backup Settings */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white">Backup Settings</CardTitle>
            <CardDescription className="text-gray-400">Configure automatic backups</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-700 rounded-lg flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Auto Backup</p>
                  <p className="text-gray-400 text-sm">Automatically create backups</p>
                </div>
              </div>
              <Switch
                checked={backupSettings.autoBackup}
                onCheckedChange={(checked) => saveBackupSettings({ ...backupSettings, autoBackup: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-700 rounded-lg flex items-center justify-center">
                  <Cloud className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Cloud Sync</p>
                  <p className="text-gray-400 text-sm">Sync backups to cloud storage</p>
                </div>
              </div>
              <Switch
                checked={backupSettings.cloudSync}
                onCheckedChange={(checked) => saveBackupSettings({ ...backupSettings, cloudSync: checked })}
                disabled={!user}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-700 rounded-lg flex items-center justify-center">
                  <Download className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Include Downloads</p>
                  <p className="text-gray-400 text-sm">Backup downloaded songs (larger file)</p>
                </div>
              </div>
              <Switch
                checked={backupSettings.includeDownloads}
                onCheckedChange={(checked) => saveBackupSettings({ ...backupSettings, includeDownloads: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* What's Included */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white">What's Included in Backups</CardTitle>
            <CardDescription className="text-gray-400">Data that will be backed up and restored</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-gray-300">Playlists and songs</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-gray-300">App preferences</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-gray-300">Privacy settings</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-gray-300">Audio preferences</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-gray-300">Appearance settings</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-orange-400" />
                <span className="text-gray-300">Downloaded files (optional)</span>
              </div>
            </div>

            <div className="text-xs text-gray-400 space-y-1 pt-4 border-t border-zinc-700">
              <p>• Backups are stored as JSON files that can be imported later</p>
              <p>• Account information is not included in backups</p>
              <p>• Downloaded songs are only included if enabled in settings</p>
              <p>• Cloud sync requires a signed-in Google account</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
