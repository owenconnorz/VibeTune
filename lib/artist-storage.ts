export interface FollowedArtist {
  id: string
  name: string
  thumbnail?: string
  followedAt: number
}

const STORAGE_KEY = "vibetune_followed_artists"

export const artistStorage = {
  getFollowedArtists: (): FollowedArtist[] => {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  },

  followArtist: (artist: Omit<FollowedArtist, "followedAt">) => {
    const artists = artistStorage.getFollowedArtists()

    // Check if already following
    if (artists.some((a) => a.id === artist.id)) {
      return artists
    }

    const newArtist: FollowedArtist = {
      ...artist,
      followedAt: Date.now(),
    }

    const updated = [newArtist, ...artists]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    window.dispatchEvent(new Event("artistsUpdated"))
    return updated
  },

  unfollowArtist: (artistId: string) => {
    const artists = artistStorage.getFollowedArtists()
    const updated = artists.filter((a) => a.id !== artistId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    window.dispatchEvent(new Event("artistsUpdated"))
    return updated
  },

  isFollowing: (artistId: string): boolean => {
    const artists = artistStorage.getFollowedArtists()
    return artists.some((a) => a.id === artistId)
  },

  getFollowedArtistsCount: (): number => {
    return artistStorage.getFollowedArtists().length
  },
}
