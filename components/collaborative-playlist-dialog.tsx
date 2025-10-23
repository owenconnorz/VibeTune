"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Users, Copy, Check, Share2 } from "lucide-react"
import { makePlaylistCollaborative, joinCollaborativePlaylist, type Playlist } from "@/lib/playlist-storage"
import { useToast } from "@/hooks/use-toast"

interface CollaborativePlaylistDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  playlist?: Playlist
  onUpdate?: () => void
}

export function CollaborativePlaylistDialog({
  open,
  onOpenChange,
  playlist,
  onUpdate,
}: CollaborativePlaylistDialogProps) {
  const [mode, setMode] = useState<"enable" | "join">("enable")
  const [shareCode, setShareCode] = useState("")
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleEnableCollaboration = () => {
    if (!playlist) return

    const updated = makePlaylistCollaborative(playlist.id)
    if (updated) {
      toast({
        title: "Collaboration enabled",
        description: "Your playlist is now collaborative. Share the code with friends!",
      })
      onUpdate?.()
      onOpenChange(false)
    }
  }

  const handleJoinPlaylist = () => {
    if (!shareCode.trim()) {
      toast({
        title: "Invalid code",
        description: "Please enter a valid share code",
        variant: "destructive",
      })
      return
    }

    const joined = joinCollaborativePlaylist(shareCode.trim().toUpperCase())
    if (joined) {
      toast({
        title: "Joined playlist",
        description: `You can now collaborate on "${joined.name}"`,
      })
      onUpdate?.()
      onOpenChange(false)
    } else {
      toast({
        title: "Playlist not found",
        description: "The share code is invalid or the playlist no longer exists",
        variant: "destructive",
      })
    }
  }

  const handleCopyCode = () => {
    if (playlist?.shareCode) {
      navigator.clipboard.writeText(playlist.shareCode)
      setCopied(true)
      toast({
        title: "Code copied",
        description: "Share code copied to clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShare = async () => {
    if (!playlist?.shareCode) return

    const shareData = {
      title: `Join my playlist: ${playlist.name}`,
      text: `Use code ${playlist.shareCode} to collaborate on my VibeTune playlist!`,
      url: `${window.location.origin}/dashboard/join-playlist?code=${playlist.shareCode}`,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        console.log("[v0] Share cancelled or failed")
      }
    } else {
      handleCopyCode()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Collaborative Playlist</DialogTitle>
          <DialogDescription>
            {mode === "enable"
              ? "Make this playlist collaborative so friends can add songs"
              : "Join a collaborative playlist using a share code"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button
            variant={mode === "enable" ? "default" : "outline"}
            className="flex-1"
            onClick={() => setMode("enable")}
          >
            Enable
          </Button>
          <Button variant={mode === "join" ? "default" : "outline"} className="flex-1" onClick={() => setMode("join")}>
            Join
          </Button>
        </div>

        {mode === "enable" ? (
          <div className="space-y-4">
            {playlist?.isCollaborative ? (
              <>
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>
                      {playlist.collaborators?.length || 0} collaborator
                      {playlist.collaborators?.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <Label>Share Code</Label>
                    <div className="flex gap-2">
                      <Input value={playlist.shareCode || ""} readOnly className="font-mono text-lg" />
                      <Button variant="outline" size="icon" onClick={handleCopyCode}>
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                      <Button variant="outline" size="icon" onClick={handleShare}>
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">Anyone with this code can add songs to your playlist</p>
                </div>
              </>
            ) : (
              <>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    <h4 className="font-semibold">Collaborate with friends</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enable collaboration to let friends add songs to this playlist. You'll get a share code to send
                    them.
                  </p>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleEnableCollaboration}>Enable Collaboration</Button>
                </DialogFooter>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="share-code">Share Code</Label>
              <Input
                id="share-code"
                placeholder="Enter 8-character code"
                value={shareCode}
                onChange={(e) => setShareCode(e.target.value.toUpperCase())}
                maxLength={8}
                className="font-mono text-lg"
              />
              <p className="text-xs text-muted-foreground">Ask your friend for their playlist share code</p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleJoinPlaylist} disabled={shareCode.length !== 8}>
                Join Playlist
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
