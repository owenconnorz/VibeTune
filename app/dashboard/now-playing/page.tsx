import { NowPlayingContent } from "@/components/now-playing-content"

export default function NowPlayingPage() {
  return (
    <div className="overscroll-none" style={{ overscrollBehavior: "contain" }}>
      <NowPlayingContent />
    </div>
  )
}
