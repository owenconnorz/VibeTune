"use server"

import { getMusicHomeFeed, getPlaylistDetails } from "@/lib/innertube"

export async function fetchMusicHomeFeed() {
  try {
    console.log("[v0] Server Action: Fetching YouTube Music home feed")
    const result = await getMusicHomeFeed()
    console.log("[v0] Server Action: Home feed fetched successfully")
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
    console.log("[v0] Server Action: Fetching playlist details for:", playlistId)
    const result = await getPlaylistDetails(playlistId)
    console.log("[v0] Server Action: Playlist details fetched successfully")
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
