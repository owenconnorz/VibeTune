"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Share2, Copy, Check, Facebook, Twitter, MessageCircle, Mail } from "lucide-react"
import type { YouTubeVideo } from "@/lib/innertube"

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  video: YouTubeVideo
  type?: "song" | "playlist"
}

export function ShareDialog({ open, onOpenChange, video, type = "song" }: ShareDialogProps) {
  const [copied, setCopied] = useState(false)

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/share/${video.id}`
  const shareText = `Check out "${video.title}" by ${video.artist} on VibeTune!`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("[v0] Failed to copy:", error)
    }
  }

  const handleShare = async (platform: string) => {
    const encodedUrl = encodeURIComponent(shareUrl)
    const encodedText = encodeURIComponent(shareText)

    let url = ""

    switch (platform) {
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`
        break
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
        break
      case "whatsapp":
        url = `https://wa.me/?text=${encodedText}%20${encodedUrl}`
        break
      case "email":
        url = `mailto:?subject=${encodeURIComponent(`Check out ${video.title}`)}&body=${encodedText}%20${encodedUrl}`
        break
    }

    if (url) {
      window.open(url, "_blank", "noopener,noreferrer")
    }
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: video.title,
          text: shareText,
          url: shareUrl,
        })
      } catch (error) {
        console.error("[v0] Error sharing:", error)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share {type}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Share link</p>
            <div className="flex items-center gap-2">
              <Input value={shareUrl} readOnly className="flex-1" />
              <Button size="icon" variant="outline" onClick={handleCopyLink}>
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Share via</p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => handleShare("twitter")} className="justify-start gap-2">
                <Twitter className="w-4 h-4" />
                Twitter
              </Button>
              <Button variant="outline" onClick={() => handleShare("facebook")} className="justify-start gap-2">
                <Facebook className="w-4 h-4" />
                Facebook
              </Button>
              <Button variant="outline" onClick={() => handleShare("whatsapp")} className="justify-start gap-2">
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </Button>
              <Button variant="outline" onClick={() => handleShare("email")} className="justify-start gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Button>
            </div>
          </div>

          {typeof navigator !== "undefined" && navigator.share && (
            <Button onClick={handleNativeShare} className="w-full" variant="default">
              <Share2 className="w-4 h-4 mr-2" />
              More sharing options
            </Button>
          )}

          <div className="pt-2 border-t">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <img
                src={video.thumbnail || "/placeholder.svg"}
                alt={video.title}
                className="w-12 h-12 rounded object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1">{video.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{video.artist}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
