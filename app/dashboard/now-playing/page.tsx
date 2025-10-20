"use client"

import dynamic from "next/dynamic"

const NowPlayingContent = dynamic(
  () => import("@/components/now-playing-content").then((mod) => ({ default: mod.NowPlayingContent })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    ),
  },
)

export default function NowPlayingPage() {
  return (
    <div className="overscroll-none" style={{ overscrollBehavior: "contain" }}>
      <NowPlayingContent />
    </div>
  )
}
