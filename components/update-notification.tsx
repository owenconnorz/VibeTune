"use client"

import { useState } from "react"
import { Bell, GitCommit, ExternalLink, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useUpdates } from "@/contexts/update-context"
import { formatDistanceToNow } from "date-fns"

export function UpdateNotificationBadge() {
  const { hasUpdates, newCommits } = useUpdates()

  if (!hasUpdates || newCommits.length === 0) {
    return null
  }

  return (
    <Badge
      variant="destructive"
      className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
    >
      {newCommits.length > 9 ? "9+" : newCommits.length}
    </Badge>
  )
}

export function UpdateNotificationButton() {
  const { hasUpdates, isChecking, checkForUpdates } = useUpdates()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          <UpdateNotificationBadge />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <GitCommit className="h-5 w-5" />
              What's New in VibeTune
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={checkForUpdates}
              disabled={isChecking}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isChecking ? "animate-spin" : ""}`} />
              {isChecking ? "Checking..." : "Check for Updates"}
            </Button>
          </div>
        </DialogHeader>
        <UpdatesList onClose={() => setIsOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

function UpdatesList({ onClose }: { onClose: () => void }) {
  const { newCommits, latestRelease, lastChecked, hasUpdates, markAsViewed, currentVersion } = useUpdates()

  const handleMarkAsViewed = () => {
    markAsViewed()
    onClose()
  }

  if (!hasUpdates && newCommits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <GitCommit className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">You're up to date!</h3>
        <p className="text-muted-foreground mb-4">No new updates available at this time.</p>
        {lastChecked && (
          <p className="text-sm text-muted-foreground">
            Last checked {formatDistanceToNow(lastChecked, { addSuffix: true })}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Current Version Info */}
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
        <div>
          <p className="text-sm font-medium">Current Version</p>
          <p className="text-xs text-muted-foreground">{currentVersion}</p>
        </div>
        {lastChecked && (
          <p className="text-xs text-muted-foreground">
            Last checked {formatDistanceToNow(lastChecked, { addSuffix: true })}
          </p>
        )}
      </div>

      {/* Latest Release */}
      {latestRelease && (
        <div className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100">Latest Release</h4>
            <Badge variant="secondary">{latestRelease.tag_name}</Badge>
          </div>
          <h5 className="font-medium mb-2">{latestRelease.name}</h5>
          {latestRelease.body && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{latestRelease.body}</p>
          )}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Released {formatDistanceToNow(new Date(latestRelease.published_at), { addSuffix: true })}
            </p>
            <Button variant="outline" size="sm" asChild>
              <a
                href={latestRelease.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1"
              >
                View Release
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>
        </div>
      )}

      {/* New Commits */}
      {newCommits.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold">Recent Updates ({newCommits.length})</h4>
            <Button variant="outline" size="sm" onClick={handleMarkAsViewed}>
              Mark as Viewed
            </Button>
          </div>
          <ScrollArea className="max-h-96">
            <div className="space-y-3">
              {newCommits.map((commit) => (
                <CommitItem key={commit.sha} commit={commit} />
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}

function CommitItem({ commit }: { commit: any }) {
  const commitDate = new Date(commit.commit.author.date)
  const commitMessage = commit.commit.message.split("\n")[0] // First line only

  return (
    <div className="flex gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-shrink-0">
        {commit.author?.avatar_url ? (
          <img
            src={commit.author.avatar_url || "/placeholder.svg"}
            alt={commit.author.login}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <GitCommit className="h-4 w-4" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium line-clamp-2 mb-1">{commitMessage}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{commit.commit.author.name}</span>
          <span>•</span>
          <span>{formatDistanceToNow(commitDate, { addSuffix: true })}</span>
          <span>•</span>
          <code className="px-1 py-0.5 bg-muted rounded text-xs">{commit.sha.substring(0, 7)}</code>
        </div>
      </div>
      <Button variant="ghost" size="sm" asChild className="flex-shrink-0">
        <a href={commit.html_url} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="h-3 w-3" />
        </a>
      </Button>
    </div>
  )
}
