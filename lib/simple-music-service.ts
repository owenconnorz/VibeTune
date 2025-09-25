export interface SimpleSong {
  id: string
  title: string
  artist: string
  thumbnail: string
  duration: string
  url: string
  audioUrl: string
}

class SimpleMusicService {
  private readonly CURATED_SONGS: SimpleSong[] = [
    {
      id: "dQw4w9WgXcQ",
      title: "Never Gonna Give You Up",
      artist: "Rick Astley",
      thumbnail: "/rick-astley-dance.png",
      duration: "3:33",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      audioUrl: "",
    },
    {
      id: "9bZkp7q19f0",
      title: "Gangnam Style",
      artist: "PSY",
      thumbnail: "/psy-gangnam-style.jpg",
      duration: "4:13",
      url: "https://www.youtube.com/watch?v=9bZkp7q19f0",
      audioUrl: "",
    },
    {
      id: "kJQP7kiw5Fk",
      title: "Despacito",
      artist: "Luis Fonsi ft. Daddy Yankee",
      thumbnail: "/despacito-luis-fonsi.jpg",
      duration: "4:42",
      url: "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
      audioUrl: "",
    },
    {
      id: "fJ9rUzIMcZQ",
      title: "Bohemian Rhapsody",
      artist: "Queen",
      thumbnail: "/queen-bohemian-rhapsody.png",
      duration: "5:55",
      url: "https://www.youtube.com/watch?v=fJ9rUzIMcZQ",
      audioUrl: "",
    },
    {
      id: "JGwWNGJdvx8",
      title: "Shape of You",
      artist: "Ed Sheeran",
      thumbnail: "/ed-sheeran-shape-of-you.jpg",
      duration: "3:54",
      url: "https://www.youtube.com/watch?v=JGwWNGJdvx8",
      audioUrl: "",
    },
    {
      id: "RgKAFK5djSk",
      title: "Wrecking Ball",
      artist: "Miley Cyrus",
      thumbnail: "/miley-cyrus-wrecking-ball.jpg",
      duration: "3:41",
      url: "https://www.youtube.com/watch?v=RgKAFK5djSk",
      audioUrl: "",
    },
    {
      id: "hT_nvWreIhg",
      title: "Counting Stars",
      artist: "OneRepublic",
      thumbnail: "/onerepublic-counting-stars.jpg",
      duration: "4:17",
      url: "https://www.youtube.com/watch?v=hT_nvWreIhg",
      audioUrl: "",
    },
    {
      id: "YQHsXMglC9A",
      title: "Hello",
      artist: "Adele",
      thumbnail: "/adele-hello.jpg",
      duration: "4:55",
      url: "https://www.youtube.com/watch?v=YQHsXMglC9A",
      audioUrl: "",
    },
    {
      id: "CevxZvSJLk8",
      title: "Roar",
      artist: "Katy Perry",
      thumbnail: "/katy-perry-roar.jpg",
      duration: "3:43",
      url: "https://www.youtube.com/watch?v=CevxZvSJLk8",
      audioUrl: "",
    },
    {
      id: "pt8VYOfr8To",
      title: "Uptown Funk",
      artist: "Mark Ronson ft. Bruno Mars",
      thumbnail: "/uptown-funk-bruno-mars.jpg",
      duration: "4:30",
      url: "https://www.youtube.com/watch?v=pt8VYOfr8To",
      audioUrl: "",
    },
    {
      id: "nfWlot6h_JM",
      title: "Shake It Off",
      artist: "Taylor Swift",
      thumbnail: "/taylor-swift-shake-it-off.jpg",
      duration: "3:39",
      url: "https://www.youtube.com/watch?v=nfWlot6h_JM",
      audioUrl: "",
    },
    {
      id: "iIq1D34L0xI",
      title: "Thinking Out Loud",
      artist: "Ed Sheeran",
      thumbnail: "/ed-sheeran-thinking-out-loud.jpg",
      duration: "4:41",
      url: "https://www.youtube.com/watch?v=iIq1D34L0xI",
      audioUrl: "",
    },
    {
      id: "7PCkvCPvDXk",
      title: "See You Again",
      artist: "Wiz Khalifa ft. Charlie Puth",
      thumbnail: "/see-you-again-wiz-khalifa.jpg",
      duration: "3:57",
      url: "https://www.youtube.com/watch?v=7PCkvCPvDXk",
      audioUrl: "",
    },
    {
      id: "uelHwf8o7_U",
      title: "Somebody That I Used to Know",
      artist: "Gotye ft. Kimbra",
      thumbnail: "/gotye-somebody-that-i-used-to-know.jpg",
      duration: "4:04",
      url: "https://www.youtube.com/watch?v=uelHwf8o7_U",
      audioUrl: "",
    },
    {
      id: "LOZuxwVk7TU",
      title: "All of Me",
      artist: "John Legend",
      thumbnail: "/john-legend-all-of-me.jpg",
      duration: "4:29",
      url: "https://www.youtube.com/watch?v=LOZuxwVk7TU",
      audioUrl: "",
    },
  ]

  async getTrending(maxResults = 25): Promise<SimpleSong[]> {
    console.log("[v0] Simple Music: Getting trending songs")

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Return shuffled songs to simulate trending
    const shuffled = [...this.CURATED_SONGS].sort(() => Math.random() - 0.5)
    const trending = shuffled.slice(0, Math.min(maxResults, this.CURATED_SONGS.length))

    console.log("[v0] Simple Music: Returning", trending.length, "trending songs")
    return trending
  }

  async search(query: string, maxResults = 15): Promise<SimpleSong[]> {
    console.log("[v0] Simple Music: Searching for:", query)

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Simple search - match title or artist
    const searchTerm = query.toLowerCase()
    const results = this.CURATED_SONGS.filter(
      (song) => song.title.toLowerCase().includes(searchTerm) || song.artist.toLowerCase().includes(searchTerm),
    )

    // If no matches, return some random songs
    if (results.length === 0) {
      const shuffled = [...this.CURATED_SONGS].sort(() => Math.random() - 0.5)
      const randomResults = shuffled.slice(0, Math.min(maxResults, 5))
      console.log("[v0] Simple Music: No matches, returning", randomResults.length, "random songs")
      return randomResults
    }

    const searchResults = results.slice(0, Math.min(maxResults, results.length))
    console.log("[v0] Simple Music: Found", searchResults.length, "search results")
    return searchResults
  }

  async getAudioUrl(videoId: string): Promise<string | null> {
    console.log("[v0] Simple Music: Getting audio URL for:", videoId)

    // Find the song
    const song = this.CURATED_SONGS.find((s) => s.id === videoId)
    if (!song) {
      console.log("[v0] Simple Music: Song not found:", videoId)
      return null
    }

    console.log("[v0] Simple Music: Returning null to trigger yt-dlp extraction for:", videoId)
    return null
  }
}

export const createSimpleMusicService = () => new SimpleMusicService()
export const simpleMusicService = new SimpleMusicService()
