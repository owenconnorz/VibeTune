"use server"

import { getMusicHomeFeed, getPlaylistDetails } from "@/lib/innertube"

export async function fetchMusicHomeFeed() {
  try {
    const result = await getMusicHomeFeed()
    return { success: true, data: result }
  } catch (error: any) {
    console.error("[v0] Server Action: Home feed error:", error.message)
    return {
      success: false,
      error: error.message,
      data: { sections: [] },
    }
  }
}

export async function fetchPlaylistDetails(playlistId: string) {
  try {
    const result = await getPlaylistDetails(playlistId)
    return { success: true, data: result }
  } catch (error: any) {
    console.error("[v0] Server Action: Playlist error:", error.message)
    return {
      success: false,
      error: error.message,
      data: null,
    }
  }
}
