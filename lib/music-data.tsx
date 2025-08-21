export function generateAlbumArtwork(artist: string, title: string): string {
  // Generate consistent color based on artist name
  const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#F7DC6F", "#85C1E9"]
  let hash = 0
  for (let i = 0; i < artist.length; i++) {
    hash = artist.charCodeAt(i) + ((hash << 5) - hash)
  }
  const color = colors[Math.abs(hash) % colors.length]

  // Get artist initials
  const initials = artist
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .join("")
    .substring(0, 2)

  // Create SVG with artist initials
  const svg = `
    <svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="300" fill="${color}"/>
      <text x="150" y="150" font-family="Arial, sans-serif" font-size="80" font-weight="bold" 
            text-anchor="middle" dominant-baseline="central" fill="white">
        ${initials}
      </text>
      <circle cx="250" cy="50" r="15" fill="white" opacity="0.3"/>
      <circle cx="50" cy="250" r="20" fill="white" opacity="0.2"/>
    </svg>
  `

  // Convert to data URL
  const dataUrl = `data:image/svg+xml;base64,${btoa(svg)}`
  console.log(`[v0] Generated SVG album artwork for: ${artist} - ${title}`)
  return dataUrl
}

// Mood playlists configuration
export const moodPlaylists = {
  "morning-boost": {
    name: "Morning Mood Boost",
    queries: ["upbeat morning music", "energetic pop songs", "feel good hits"],
  },
  sleep: {
    name: "Sleep",
    queries: ["relaxing sleep music", "ambient sounds", "peaceful instrumental"],
  },
  chill: {
    name: "Chill",
    queries: ["chill music", "lo-fi beats", "relaxing songs"],
  },
  workout: {
    name: "Workout",
    queries: ["workout music", "high energy songs", "gym motivation"],
  },
}

// Fetch trending music function
export async function fetchTrendingMusic() {
  try {
    const response = await fetch("/api/music/trending")
    if (!response.ok) {
      throw new Error("Failed to fetch trending music")
    }
    return await response.json()
  } catch (error) {
    console.error("[v0] Error fetching trending music:", error)
    return []
  }
}

// Search music function
export async function searchMusic(query: string) {
  try {
    const response = await fetch(`/api/music/search?q=${encodeURIComponent(query)}`)
    if (!response.ok) {
      throw new Error("Failed to search music")
    }
    return await response.json()
  } catch (error) {
    console.error("[v0] Error searching music:", error)
    return []
  }
}
