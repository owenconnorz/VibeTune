import { PlaylistContent } from "@/components/playlist-content"
import { MiniPlayer } from "@/components/mini-player"

export default function PlaylistPage({ params }: { params: { id: string } }) {
  return (
    <>
      <PlaylistContent playlistId={params.id} />
      <MiniPlayer />
    </>
  )
}
