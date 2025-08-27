export interface OfflineTrack {
  id: string
  title: string
  artist: string
  duration: string
  thumbnail: string
  videoUrl: string
  genre: string[]
  tags: string[]
  popularity: number
}

const OFFLINE_MUSIC_DATABASE: OfflineTrack[] = [
  // Chill/Ambient Music
  {
    id: "chill-1",
    title: "Weightless",
    artist: "Marconi Union",
    duration: "8:10",
    thumbnail: "/ambient-chill-music.png",
    videoUrl: "https://www.youtube.com/watch?v=UfcAVejslrU",
    genre: ["ambient", "chill"],
    tags: ["chill", "relaxing", "ambient", "peaceful", "meditation"],
    popularity: 95,
  },
  {
    id: "chill-2",
    title: "Aqueous Transmission",
    artist: "Incubus",
    duration: "7:49",
    thumbnail: "/incubus-chill.png",
    videoUrl: "https://www.youtube.com/watch?v=3k0-sGqxIiQ",
    genre: ["alternative", "chill"],
    tags: ["chill", "alternative", "rock", "peaceful"],
    popularity: 88,
  },
  {
    id: "chill-3",
    title: "Porcelain",
    artist: "Moby",
    duration: "4:01",
    thumbnail: "/moby-porcelain.png",
    videoUrl: "https://www.youtube.com/watch?v=IJWlBfo5Oj0",
    genre: ["electronic", "chill"],
    tags: ["chill", "electronic", "ambient", "downtempo"],
    popularity: 92,
  },
  {
    id: "chill-4",
    title: "Teardrop",
    artist: "Massive Attack",
    duration: "5:29",
    thumbnail: "/massive-attack-teardrop.png",
    videoUrl: "https://www.youtube.com/watch?v=u7K72X4eo_s",
    genre: ["trip-hop", "chill"],
    tags: ["chill", "trip-hop", "electronic", "atmospheric"],
    popularity: 90,
  },
  {
    id: "chill-5",
    title: "Breathe Me",
    artist: "Sia",
    duration: "4:31",
    thumbnail: "/sia-breathe-me.png",
    videoUrl: "https://www.youtube.com/watch?v=ghPcYqn0p4Y",
    genre: ["pop", "chill"],
    tags: ["chill", "emotional", "pop", "acoustic"],
    popularity: 87,
  },

  // Popular/Trending Music
  {
    id: "pop-1",
    title: "Blinding Lights",
    artist: "The Weeknd",
    duration: "3:20",
    thumbnail: "/weeknd-blinding-lights.png",
    videoUrl: "https://www.youtube.com/watch?v=4NRXx6U8ABQ",
    genre: ["pop", "synthwave"],
    tags: ["trending", "popular", "pop", "synthwave", "2020s"],
    popularity: 98,
  },
  {
    id: "pop-2",
    title: "Shape of You",
    artist: "Ed Sheeran",
    duration: "3:53",
    thumbnail: "/ed-sheeran-shape-of-you.png",
    videoUrl: "https://www.youtube.com/watch?v=JGwWNGJdvx8",
    genre: ["pop"],
    tags: ["trending", "popular", "pop", "acoustic"],
    popularity: 96,
  },
  {
    id: "pop-3",
    title: "Hello",
    artist: "Adele",
    duration: "4:55",
    thumbnail: "/adele-hello.png",
    videoUrl: "https://www.youtube.com/watch?v=YQHsXMglC9A",
    genre: ["pop", "soul"],
    tags: ["trending", "popular", "pop", "soul", "ballad"],
    popularity: 94,
  },

  // Classic Rock
  {
    id: "rock-1",
    title: "Bohemian Rhapsody",
    artist: "Queen",
    duration: "5:55",
    thumbnail: "/queen-bohemian-rhapsody.png",
    videoUrl: "https://www.youtube.com/watch?v=fJ9rUzIMcZQ",
    genre: ["rock", "classic"],
    tags: ["classic", "rock", "queen", "legendary"],
    popularity: 99,
  },
  {
    id: "rock-2",
    title: "Smells Like Teen Spirit",
    artist: "Nirvana",
    duration: "5:01",
    thumbnail: "/nirvana-teen-spirit.png",
    videoUrl: "https://www.youtube.com/watch?v=hTWKbfoikeg",
    genre: ["grunge", "rock"],
    tags: ["grunge", "rock", "90s", "alternative"],
    popularity: 93,
  },

  // Hip-Hop
  {
    id: "hiphop-1",
    title: "Gangnam Style",
    artist: "PSY",
    duration: "3:39",
    thumbnail: "/psy-gangnam-style.png",
    videoUrl: "https://www.youtube.com/watch?v=9bZkp7q19f0",
    genre: ["k-pop", "hip-hop"],
    tags: ["viral", "k-pop", "dance", "trending"],
    popularity: 97,
  },
  {
    id: "hiphop-2",
    title: "Despacito",
    artist: "Luis Fonsi ft. Daddy Yankee",
    duration: "3:47",
    thumbnail: "/despacito.png",
    videoUrl: "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
    genre: ["reggaeton", "latin"],
    tags: ["latin", "reggaeton", "viral", "trending"],
    popularity: 98,
  },

  // More Chill Music
  {
    id: "chill-6",
    title: "Mad World",
    artist: "Gary Jules",
    duration: "3:07",
    thumbnail: "/gary-jules-mad-world.png",
    videoUrl: "https://www.youtube.com/watch?v=4N3N1MlvVc4",
    genre: ["alternative", "chill"],
    tags: ["chill", "melancholy", "alternative", "cover"],
    popularity: 89,
  },
  {
    id: "chill-7",
    title: "Black",
    artist: "Pearl Jam",
    duration: "5:43",
    thumbnail: "/pearl-jam-black.png",
    videoUrl: "https://www.youtube.com/watch?v=5ChbxMVgGV4",
    genre: ["grunge", "chill"],
    tags: ["chill", "grunge", "emotional", "ballad"],
    popularity: 91,
  },
  {
    id: "chill-8",
    title: "Hurt",
    artist: "Johnny Cash",
    duration: "3:38",
    thumbnail: "/johnny-cash-hurt.png",
    videoUrl: "https://www.youtube.com/watch?v=8AHCfZTRGiI",
    genre: ["country", "chill"],
    tags: ["chill", "country", "cover", "emotional"],
    popularity: 93,
  },
]

export class OfflineMusicDatabase {
  private tracks: OfflineTrack[] = OFFLINE_MUSIC_DATABASE

  search(query: string, maxResults = 10): OfflineTrack[] {
    if (!query || query.trim() === "") {
      return this.getTrending(maxResults)
    }

    const searchTerms = query.toLowerCase().split(" ")

    const scoredTracks = this.tracks.map((track) => {
      let score = 0
      const searchableText =
        `${track.title} ${track.artist} ${track.genre.join(" ")} ${track.tags.join(" ")}`.toLowerCase()

      // Exact matches get highest score
      if (searchableText.includes(query.toLowerCase())) {
        score += 100
      }

      // Individual term matches
      searchTerms.forEach((term) => {
        if (searchableText.includes(term)) {
          score += 10
        }
        if (track.title.toLowerCase().includes(term)) {
          score += 20
        }
        if (track.artist.toLowerCase().includes(term)) {
          score += 15
        }
        if (track.tags.some((tag) => tag.includes(term))) {
          score += 25
        }
      })

      // Boost popular tracks slightly
      score += track.popularity * 0.1

      return { track, score }
    })

    return scoredTracks
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map((item) => item.track)
  }

  getTrending(maxResults = 10): OfflineTrack[] {
    return [...this.tracks].sort((a, b) => b.popularity - a.popularity).slice(0, maxResults)
  }

  getByGenre(genre: string, maxResults = 10): OfflineTrack[] {
    return this.tracks
      .filter((track) => track.genre.some((g) => g.toLowerCase().includes(genre.toLowerCase())))
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, maxResults)
  }

  getRandomTracks(maxResults = 10): OfflineTrack[] {
    const shuffled = [...this.tracks].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, maxResults)
  }
}

export const offlineMusicDB = new OfflineMusicDatabase()
