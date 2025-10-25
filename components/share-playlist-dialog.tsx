"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Share2, Copy, Check, Facebook, Twitter, MessageCircle } from "lucide-react"
import type { Playlist } from "@/lib/playlist-storage"

interface SharePlaylistDialogProps {
  playlist: Playlist
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SharePlaylistDialog({ playlist, open, onOpenChange }: SharePlaylistDialogProps) {
  const [copied, setCopied] = useState(false)
  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/dashboard/playlist/${playlist.id}`
  const shareText = `Check out my playlist "${playlist.name}" with ${playlist.videos.length} songs on OpenTune!`

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareToSocial = (platform: string) => {
    const encodedUrl = encodeURIComponent(shareUrl)
    const encodedText = encodeURIComponent(shareText)

    const urls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    }

    if (urls[platform]) {
      window.open(urls[platform], "_blank", "width=600,height=400")
    }
  }

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: playlist.name,
          text: shareText,
          url: shareUrl,
        })
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.log("[v0] Share cancelled or failed:", error)
        }
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share playlist</DialogTitle>
          <DialogDescription>Share "{playlist.name}" with your friends</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Playlist link</Label>
            <div className="flex gap-2">
              <Input value={shareUrl} readOnly className="flex-1" />
              <Button variant="outline" size="icon" onClick={copyToClipboard}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Share via</Label>
            <div className="grid grid-cols-4 gap-2">
              {navigator.share && (
                <Button
                  variant="outline"
                  className="flex flex-col gap-1 h-auto py-3 bg-transparent"
                  onClick={shareNative}
                >
                  <Share2 className="w-5 h-5" />
                  <span className="text-xs">Share</span>
                </Button>
              )}
              <Button
                variant="outline"
                className="flex flex-col gap-1 h-auto py-3 bg-transparent"
                onClick={() => shareToSocial("facebook")}
              >
                <Facebook className="w-5 h-5" />
                <span className="text-xs">Facebook</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col gap-1 h-auto py-3 bg-transparent"
                onClick={() => shareToSocial("twitter")}
              >
                <Twitter className="w-5 h-5" />
                <span className="text-xs">Twitter</span>
              </Button>
              <Button
                variant="outline"
                className="flex flex-col gap-1 h-auto py-3 bg-transparent"
                onClick={() => shareToSocial("whatsapp")}
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-xs">WhatsApp</span>
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground text-center">
              Anyone with this link can view and import this playlist
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
