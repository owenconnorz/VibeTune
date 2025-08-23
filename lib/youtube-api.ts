// YouTube API utility functions for fetching music data using YouTube Data API v3

export interface YouTubeVideo {
  id: string
  title: string
  channelTitle: string
  thumbnail: string
  duration: string
  viewCount: string
  publishedAt: string
  type?: "song" | "artist" | "album" | "playlist"
  isArtistChannel?: boolean
  isAlbumPlaylist?: boolean
}

export interface YouTubeArtist {
  id: string
  name: string
  thumbnail: string
  subscriberCount?: string
  description?: string
  type: "artist"
}

export interface YouTubeAlbum {
  id: string
  title: string
  artist: string
  thumbnail: string
  videoCount: number
  publishedAt: string
  type: "album"
}

export interface EnhancedSearchResult {
  songs: YouTubeVideo[]
  artists: YouTubeArtist[]
  albums: YouTubeAlbum[]
  playlists: YouTubePlaylist[]
  nextPageToken?: string
}

export interface YouTubePlaylist {
  id: string
  title: string
  description: string
  thumbnail: string
  videoCount: number
  privacy: string
  publishedAt: string
}

export interface YouTubeSearchResult {
  videos: YouTubeVideo[]
  nextPageToken?: string
}

const FALLBACK_TRENDING_SONGS: YouTubeVideo[] = [
  {
    id: "3tmd-ClpJxA",
    title: "Shape of You",
    channelTitle: "Ed Sheeran",
    thumbnail: "https://img.youtube.com/vi/3tmd-ClpJxA/hqdefault.jpg",
    duration: "3:53",
    viewCount: "5800000000",
    publishedAt: "2017-01-06T00:00:00Z",
  },
  {
    id: "YQHsXMglC9A",
    title: "Hello",
    channelTitle: "Adele",
    thumbnail: "https://img.youtube.com/vi/YQHsXMglC9A/hqdefault.jpg",
    duration: "4:55",
    viewCount: "3200000000",
    publishedAt: "2015-10-23T00:00:00Z",
  },
  {
    id: "CevxZvSJLk8",
    title: "Roar",
    channelTitle: "Katy Perry",
    thumbnail: "https://img.youtube.com/vi/CevxZvSJLk8/hqdefault.jpg",
    duration: "3:43",
    viewCount: "3700000000",
    publishedAt: "2013-09-05T00:00:00Z",
  },
]

const FALLBACK_SEARCH_SONGS: YouTubeVideo[] = [
  {
    id: "dQw4w9WgXcQ",
    title: "Never Gonna Give You Up",
    channelTitle: "Rick Astley",
    thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    duration: "3:33",
    viewCount: "1400000000",
    publishedAt: "1987-07-27T00:00:00Z",
  },
  {
    id: "kJQP7kiw5Fk",
    title: "Despacito",
    channelTitle: "Luis Fonsi ft. Daddy Yankee",
    thumbnail: "https://img.youtube.com/vi/kJQP7kiw5Fk/hqdefault.jpg",
    duration: "4:42",
    viewCount: "8000000000",
    publishedAt: "2017-01-12T00:00:00Z",
  },
  {
    id: "fJ9rUzIMcZQ",
    title: "Bohemian Rhapsody",
    channelTitle: "Queen",
    thumbnail: "https://img.youtube.com/vi/fJ9rUzIMcZQ/hqdefault.jpg",
    duration: "5:55",
    viewCount: "1800000000",
    publishedAt: "1975-10-31T00:00:00Z",
  },
  {
    id: "L_jWHffIx5E",
    title: "Smells Like Teen Spirit",
    channelTitle: "Nirvana",
    thumbnail: "https://img.youtube.com/vi/L_jWHffIx5E/hqdefault.jpg",
    duration: "5:01",
    viewCount: "1600000000",
    publishedAt: "1991-09-10T00:00:00Z",
  },
  {
    id: "9bZkp7q19f0",
    title: "Gangnam Style",
    channelTitle: "PSY",
    thumbnail: "https://img.youtube.com/vi/9bZkp7q19f0/hqdefault.jpg",
    duration: "4:13",
    viewCount: "4600000000",
    publishedAt: "2012-07-15T00:00:00Z",
  },
]

const CATEGORY_SPECIFIC_FALLBACK: Record<string, YouTubeVideo[]> = {
  "happy-pop-hits": [
    {
      id: "CevxZvSJLk8",
      title: "Roar",
      channelTitle: "Katy Perry",
      thumbnail: "https://img.youtube.com/vi/CevxZvSJLk8/hqdefault.jpg",
      duration: "3:43",
      viewCount: "3700000000",
      publishedAt: "2013-09-05T00:00:00Z",
    },
    {
      id: "hT_nvWreIhg",
      title: "Shape of You",
      channelTitle: "Ed Sheeran",
      thumbnail: "https://img.youtube.com/vi/hT_nvWreIhg/hqdefault.jpg",
      duration: "3:53",
      viewCount: "5800000000",
      publishedAt: "2017-01-06T00:00:00Z",
    },
    {
      id: "YQHsXMglC9A",
      title: "Hello",
      channelTitle: "Adele",
      thumbnail: "https://img.youtube.com/vi/YQHsXMglC9A/hqdefault.jpg",
      duration: "4:55",
      viewCount: "3200000000",
      publishedAt: "2015-10-23T00:00:00Z",
    },
    {
      id: "JGwWNGJdvx8",
      title: "See You Again",
      channelTitle: "Wiz Khalifa ft. Charlie Puth",
      thumbnail: "https://img.youtube.com/vi/JGwWNGJdvx8/hqdefault.jpg",
      duration: "3:57",
      viewCount: "5500000000",
      publishedAt: "2015-04-06T00:00:00Z",
    },
    {
      id: "9bZkp7q19f0",
      title: "Gangnam Style",
      channelTitle: "PSY",
      thumbnail: "https://img.youtube.com/vi/9bZkp7q19f0/hqdefault.jpg",
      duration: "4:13",
      viewCount: "4600000000",
      publishedAt: "2012-07-15T00:00:00Z",
    },
    {
      id: "kffacxfA7G4",
      title: "Baby One More Time",
      channelTitle: "Britney Spears",
      thumbnail: "https://img.youtube.com/vi/kffacxfA7G4/hqdefault.jpg",
      duration: "3:30",
      viewCount: "800000000",
      publishedAt: "1998-10-23T00:00:00Z",
    },
    {
      id: "pRpeEdMmmQ0",
      title: "Shake It Off",
      channelTitle: "Taylor Swift",
      thumbnail: "https://img.youtube.com/vi/pRpeEdMmmQ0/hqdefault.jpg",
      duration: "3:39",
      viewCount: "3200000000",
      publishedAt: "2014-08-18T00:00:00Z",
    },
    {
      id: "nfWlot6h_JM",
      title: "Shake It Off",
      channelTitle: "Taylor Swift",
      thumbnail: "https://img.youtube.com/vi/nfWlot6h_JM/hqdefault.jpg",
      duration: "3:39",
      viewCount: "3200000000",
      publishedAt: "2014-08-18T00:00:00Z",
    },
  ],
  "hip-hop-classics": [
    {
      id: "_Yhyp-_hX2s",
      title: "Lose Yourself",
      channelTitle: "Eminem",
      thumbnail: "https://img.youtube.com/vi/_Yhyp-_hX2s/hqdefault.jpg",
      duration: "5:26",
      viewCount: "1200000000",
      publishedAt: "2002-10-28T00:00:00Z",
    },
    {
      id: "_JZom_gVfuw",
      title: "Juicy",
      channelTitle: "The Notorious B.I.G.",
      thumbnail: "https://img.youtube.com/vi/_JZom_gVfuw/hqdefault.jpg",
      duration: "5:02",
      viewCount: "400000000",
      publishedAt: "1994-08-04T00:00:00Z",
    },
    {
      id: "5wBTdfAkqGU",
      title: "California Love",
      channelTitle: "2Pac ft. Dr. Dre",
      thumbnail: "https://img.youtube.com/vi/5wBTdfAkqGU/hqdefault.jpg",
      duration: "4:17",
      viewCount: "800000000",
      publishedAt: "1995-12-28T00:00:00Z",
    },
    {
      id: "UKjj4hk0pV4",
      title: "The Message",
      channelTitle: "Grandmaster Flash",
      thumbnail: "https://img.youtube.com/vi/UKjj4hk0pV4/hqdefault.jpg",
      duration: "7:11",
      viewCount: "50000000",
      publishedAt: "1982-07-01T00:00:00Z",
    },
    {
      id: "CHVhwcOg6y8",
      title: "N.Y. State of Mind",
      channelTitle: "Nas",
      thumbnail: "https://img.youtube.com/vi/CHVhwcOg6y8/hqdefault.jpg",
      duration: "4:54",
      viewCount: "100000000",
      publishedAt: "1994-04-19T00:00:00Z",
    },
    {
      id: "SW-BU6keEUw",
      title: "B.I.G. Poppa",
      channelTitle: "The Notorious B.I.G.",
      thumbnail: "https://img.youtube.com/vi/SW-BU6keEUw/hqdefault.jpg",
      duration: "4:12",
      viewCount: "300000000",
      publishedAt: "1994-12-13T00:00:00Z",
    },
    {
      id: "41qC3w3UUkU",
      title: "Dear Mama",
      channelTitle: "2Pac",
      thumbnail: "https://img.youtube.com/vi/41qC3w3UUkU/hqdefault.jpg",
      duration: "4:40",
      viewCount: "600000000",
      publishedAt: "1995-02-21T00:00:00Z",
    },
    {
      id: "P800UWoE9xs",
      title: "It Was a Good Day",
      channelTitle: "Ice Cube",
      thumbnail: "https://img.youtube.com/vi/P800UWoE9xs/hqdefault.jpg",
      duration: "4:20",
      viewCount: "200000000",
      publishedAt: "1992-10-27T00:00:00Z",
    },
  ],
  "r-b-party-starters": [
    {
      id: "ViwtNLUqkMY",
      title: "Crazy in Love",
      channelTitle: "Beyoncé ft. Jay-Z",
      thumbnail: "/placeholder.svg?height=300&width=300",
      duration: "3:56",
      viewCount: "900000000",
      publishedAt: "2003-05-18T00:00:00Z",
    },
    {
      id: "sQgd6MccwZc",
      title: "Say My Name",
      channelTitle: "Destiny's Child",
      thumbnail: "/placeholder.svg?height=300&width=300",
      duration: "4:31",
      viewCount: "700000000",
      publishedAt: "1999-10-14T00:00:00Z",
    },
    {
      id: "OPf0YbXqDm0",
      title: "Uptown Funk",
      channelTitle: "Mark Ronson ft. Bruno Mars",
      thumbnail: "/placeholder.svg?height=300&width=300",
      duration: "4:30",
      viewCount: "4800000000",
      publishedAt: "2014-11-10T00:00:00Z",
    },
    {
      id: "4m1EFMoRFvY",
      title: "Single Ladies",
      channelTitle: "Beyoncé",
      thumbnail: "/placeholder.svg?height=300&width=300",
      duration: "3:13",
      viewCount: "1200000000",
      publishedAt: "2008-10-13T00:00:00Z",
    },
    {
      id: "7PCkvCPvDXk",
      title: "Yeah!",
      channelTitle: "Usher ft. Lil Jon & Ludacris",
      thumbnail: "/placeholder.svg?height=300&width=300",
      duration: "4:10",
      viewCount: "800000000",
      publishedAt: "2004-01-27T00:00:00Z",
    },
    {
      id: "kdemFfbS5H0",
      title: "Goodies",
      channelTitle: "Ciara ft. Petey Pablo",
      thumbnail: "/placeholder.svg?height=300&width=300",
      duration: "3:58",
      viewCount: "400000000",
      publishedAt: "2004-06-08T00:00:00Z",
    },
    {
      id: "VBmMU_iwe6U",
      title: "Hips Don't Lie",
      channelTitle: "Shakira ft. Wyclef Jean",
      thumbnail: "/placeholder.svg?height=300&width=300",
      duration: "3:38",
      viewCount: "1100000000",
      publishedAt: "2006-02-28T00:00:00Z",
    },
    {
      id: "lp-EO5I60KA",
      title: "Toxic",
      channelTitle: "Britney Spears",
      thumbnail: "/placeholder.svg?height=300&width=300",
      duration: "3:19",
      viewCount: "600000000",
      publishedAt: "2003-12-12T00:00:00Z",
    },
  ],
  "classic-pop-party": [
    {
      id: "fJ9rUzIMcZQ",
      title: "Bohemian Rhapsody",
      channelTitle: "Queen",
      thumbnail: "/queen-bohemian-rhapsody.png",
      duration: "5:55",
      viewCount: "1800000000",
      publishedAt: "1975-10-31T00:00:00Z",
    },
    {
      id: "HgzGwKwLmgM",
      title: "Don't Stop Me Now",
      channelTitle: "Queen",
      thumbnail: "/placeholder.svg?height=300&width=300",
      duration: "3:29",
      viewCount: "800000000",
      publishedAt: "1978-10-26T00:00:00Z",
    },
    {
      id: "WGU_4-5RaxU",
      title: "Heart of Glass",
      channelTitle: "Blondie",
      thumbnail: "/placeholder.svg?height=300&width=300",
      duration: "4:15",
      viewCount: "400000000",
      publishedAt: "1978-12-01T00:00:00Z",
    },
    {
      id: "fUis9yny_lI",
      title: "Dancing Queen",
      channelTitle: "ABBA",
      thumbnail: "/placeholder.svg?height=300&width=300",
      duration: "3:51",
      viewCount: "900000000",
      publishedAt: "1976-08-15T00:00:00Z",
    },
    {
      id: "djV11Xbc914",
      title: "We Will Rock You",
      channelTitle: "Queen",
      thumbnail: "/placeholder.svg?height=300&width=300",
      duration: "2:02",
      viewCount: "1200000000",
      publishedAt: "1977-10-07T00:00:00Z",
    },
    {
      id: "04854XqcfCY",
      title: "I Want It That Way",
      channelTitle: "Backstreet Boys",
      thumbnail: "/placeholder.svg?height=300&width=300",
      duration: "3:33",
      viewCount: "1500000000",
      publishedAt: "1999-04-12T00:00:00Z",
    },
    {
      id: "4fndeDfaWCg",
      title: "Everybody (Backstreet's Back)",
      channelTitle: "Backstreet Boys",
      thumbnail: "/placeholder.svg?height=300&width=300",
      duration: "3:44",
      viewCount: "800000000",
      publishedAt: "1997-06-11T00:00:00Z",
    },
    {
      id: "btPJPFnesV4",
      title: "Eye of the Tiger",
      channelTitle: "Survivor",
      thumbnail: "/placeholder.svg?height=300&width=300",
      duration: "4:05",
      viewCount: "700000000",
      publishedAt: "1982-05-29T00:00:00Z",
    },
  ],
  "80s-sing-alongs": [
    {
      id: "dQw4w9WgXcQ",
      title: "Never Gonna Give You Up",
      channelTitle: "Rick Astley",
      thumbnail: "/rick-astley-dance.png",
      duration: "3:33",
      viewCount: "1400000000",
      publishedAt: "1987-07-27T00:00:00Z",
    },
    {
      id: "djV11Xbc914",
      title: "Take On Me",
      channelTitle: "a-ha",
      thumbnail: "/placeholder.svg?height=300&width=300",
      duration: "3:47",
      viewCount: "1200000000",
      publishedAt: "1985-10-19T00:00:00Z",
    },
    {
      id: "1w7OgIMMRc4",
      title: "Sweet Child O' Mine",
      channelTitle: "Guns N' Roses",
      thumbnail: "/placeholder.svg?height=300&width=300",
      duration: "5:03",
      viewCount: "1500000000",
      publishedAt: "1987-06-01T00:00:00Z",
    },
    {
      id: "ZyhrYis509A",
      title: "Billie Jean",
      channelTitle: "Michael Jackson",
      thumbnail: "/placeholder.svg?height=300&width=300",
      duration: "4:54",
      viewCount: "2000000000",
      publishedAt: "1983-01-02T00:00:00Z",
    },
    {
      id: "Zi_XLOBDo_Y",
      title: "Beat It",
      channelTitle: "Michael Jackson",
      thumbnail: "/placeholder.svg?height=300&width=300",
      duration: "4:18",
      viewCount: "1800000000",
      publishedAt: "1983-02-14T00:00:00Z",
    },
    {
      id: "eH3giaIzONA",
      title: "Girls Just Want to Have Fun",
      channelTitle: "Cyndi Lauper",
      thumbnail: "/placeholder.svg?height=300&width=300",
      duration: "3:58",
      viewCount: "600000000",
      publishedAt: "1983-09-06T00:00:00Z",
    },
    {
      id: "VdQY7BusJNU",
      title: "Footloose",
      channelTitle: "Kenny Loggins",
      thumbnail: "/placeholder.svg?height=300&width=300",
      duration: "3:46",
      viewCount: "500000000",
      publishedAt: "1984-01-31T00:00:00Z",
    },
    {
      id: "StlMdNcvCJo",
      title: "Every Breath You Take",
      channelTitle: "The Police",
      thumbnail: "/placeholder.svg?height=300&width=300",
      duration: "4:13",
      viewCount: "900000000",
      publishedAt: "1983-05-20T00:00:00Z",
    },
  ],
  "feel-good-pop-rock": [
    {
      id: "hT_nvWreIhg",
      title: "Shape of You",
      channelTitle: "Ed Sheeran",
      thumbnail: "/placeholder.svg?height=300&width=300",
      duration: "3:53",
      viewCount: "5800000000",
      publishedAt: "2017-01-06T00:00:00Z",
    },
    {
      id: "pRpeEdMmmQ0",
      title: "Shake It Off",
      channelTitle: "Taylor Swift",
      thumbnail: "/placeholder.svg?height=300&width=300",
      duration: "3:39",
      viewCount: "3200000000",
      publishedAt: "2014-08-18T00:00:00Z",
    },
    {
      id: "iEPTlhBmwRg",
      title: "Sugar",
      channelTitle: "Maroon 5",
      thumbnail: "/placeholder.svg?height=300&width=300",
      duration: "3:55",
      viewCount: "3600000000",
      publishedAt: "2015-01-14T00:00:00Z",
    },
    {
      id: "ru0K8uYEZWw",
      title: "Can't Stop the Feeling!",
      channelTitle: "Justin Timberlake",
      thumbnail: "/placeholder.svg?height=300&width=300",
      duration: "3:56",
      viewCount: "2800000000",
      publishedAt: "2016-05-06T00:00:00Z",
    },
    {
      id: "YQHsXMglC9A",
      title: "Happy",
      channelTitle: "Pharrell Williams",
      thumbnail: "/placeholder.svg?height=300&width=300",
      duration: "3:53",
      viewCount: "1400000000",
      publishedAt: "2013-11-21T00:00:00Z",
    },
    {
      id: "nfWlot6h_JM",
      title: "Perfect",
      channelTitle: "Ed Sheeran",
      thumbnail: "/placeholder.svg?height=300&width=300",
      duration: "4:23",
      viewCount: "3500000000",
      publishedAt: "2017-03-03T00:00:00Z",
    },
    {
      id: "CevxZvSJLk8",
      title: "Count on Me",
      channelTitle: "Bruno Mars",
      thumbnail: "/placeholder.svg?height=300&width=300",
      duration: "3:17",
      viewCount: "800000000",
      publishedAt: "2010-10-04T00:00:00Z",
    },
    {
      id: "JGwWNGJdvx8",
      title: "What Makes You Beautiful",
      channelTitle: "One Direction",
      thumbnail: "/placeholder.svg?height=300&width=300",
      duration: "3:23",
      viewCount: "1300000000",
      publishedAt: "2011-09-11T00:00:00Z",
    },
  ],
  "feel-good-r-b-vibes": [
    {
      id: "OPf0YbXqDm0",
      title: "Uptown Funk",
      channelTitle: "Mark Ronson ft. Bruno Mars",
      thumbnail: "/placeholder.svg?height=300&width=300",
      duration: "4:30",
      viewCount: "4800000000",
      publishedAt: "2014-11-10T00:00:00Z",
    },
    {
      id: "4NRXx6U8ABQ",
      title: "Blinding Lights",
      channelTitle: "The Weeknd",
      thumbnail: "/placeholder.svg?height=300&width=300",
      duration: "3:20",
      viewCount: "2800000000",
      publishedAt: "2019-11-29T00:00:00Z",
    },
    {
      id: "SmbmeOgWsqE",
      title: "Good as Hell",
      channelTitle: "Lizzo",
      thumbnail: "/placeholder.svg?height=300&width=300",
      duration: "2:39",
      viewCount: "800000000",
      publishedAt: "2019-08-30T00:00:00Z",
    },
    {
      id: "UqyT8IEBkvY",
      title: "24K Magic",
      channelTitle: "Bruno Mars",
      thumbnail: "/placeholder.svg?height=300&width=300",
      duration: "3:46",
      viewCount: "1200000000",
      publishedAt: "2016-10-07T00:00:00Z",
    },
    {
      id: "09R8_2nJtjg",
      title: "Superstition",
      channelTitle: "Stevie Wonder",
      thumbnail: "/placeholder.svg?height=300&width=300",
      duration: "4:26",
      viewCount: "400000000",
      publishedAt: "1972-10-24T00:00:00Z",
    },
    {
      id: "L_jWHffIx5E",
      title: "I Want You Back",
      channelTitle: "The Jackson 5",
      thumbnail: "/placeholder.svg?height=300&width=300",
      duration: "2:59",
      viewCount: "300000000",
      publishedAt: "1969-10-07T00:00:00Z",
    },
    {
      id: "RgKAFK5djSk",
      title: "Isn't She Lovely",
      channelTitle: "Stevie Wonder",
      thumbnail: "/placeholder.svg?height=300&width=300",
      duration: "6:34",
      viewCount: "200000000",
      publishedAt: "1976-09-28T00:00:00Z",
    },
    {
      id: "fJ9rUzIMcZQ",
      title: "Lovely Day",
      channelTitle: "Bill Withers",
      thumbnail: "/placeholder.svg?height=300&width=300",
      duration: "4:15",
      viewCount: "150000000",
      publishedAt: "1977-12-01T00:00:00Z",
    },
  ],
}

export class YouTubeAPI {
  private baseUrl = "https://www.googleapis.com/youtube/v3"
  private apiKey: string
  private quotaExceeded = false
  private lastQuotaCheck = 0
  private quotaResetTime = 24 * 60 * 60 * 1000 // 24 hours

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.YOUTUBE_API_KEY || "AIzaSyBIQVGnXO2T7smsxf6q_MWxMD1sQzek1Nc"
  }

  private isQuotaExceeded(): boolean {
    const now = Date.now()
    if (now - this.lastQuotaCheck > this.quotaResetTime) {
      this.quotaExceeded = false
      this.lastQuotaCheck = now
    }
    return this.quotaExceeded
  }

  private markQuotaExceeded(): void {
    this.quotaExceeded = true
    this.lastQuotaCheck = Date.now()
  }

  async searchMusic(query: string, maxResults = 10): Promise<YouTubeSearchResult> {
    console.log("[v0] YouTube API searchMusic called with query:", query, "maxResults:", maxResults)

    if (!query.trim()) {
      console.log("[v0] Empty query provided, returning empty results")
      return { videos: [], nextPageToken: undefined }
    }

    try {
      console.log("[v0] Attempting YouTube API call for query:", query)
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?` +
          `part=snippet&type=video&videoCategoryId=10&maxResults=${maxResults}&q=${encodeURIComponent(query)}&key=${this.apiKey}`,
      )

      if (!response.ok) {
        const errorData = await response.json()
        console.log("[v0] YouTube API error response:", JSON.stringify(errorData, null, 2))

        if (response.status === 403 && errorData.error?.errors?.[0]?.reason === "quotaExceeded") {
          console.log("[v0] Quota exceeded - switching to fallback mode for query:", query)
          return this.getFallbackResults(query, maxResults)
        }

        throw new Error(`YouTube API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("[v0] YouTube API success - got", data.items?.length || 0, "results for query:", query)

      if (!data.items || data.items.length === 0) {
        console.log("[v0] No results from YouTube API, using fallback for query:", query)
        return this.getFallbackResults(query, maxResults)
      }

      const videoIds = data.items.map((item: any) => item.id.videoId).filter(Boolean)
      const detailedVideos = await this.getVideoDetails(videoIds)

      console.log("[v0] Successfully processed", detailedVideos.length, "videos for query:", query)
      return {
        videos: detailedVideos,
        nextPageToken: data.nextPageToken,
      }
    } catch (error) {
      console.log("[v0] YouTube API error for query:", query, "Error:", error)
      console.log("[v0] Falling back to category-specific results")
      return this.getFallbackResults(query, maxResults)
    }
  }

  async getTrendingMusic(maxResults = 20): Promise<YouTubeVideo[]> {
    console.log("[v0] Starting getTrendingMusic")

    if (this.isQuotaExceeded()) {
      console.log("[v0] Quota exceeded, returning fallback trending data")
      return FALLBACK_TRENDING_SONGS.slice(0, maxResults)
    }

    try {
      const url = new URL(`${this.baseUrl}/videos`)
      url.searchParams.set("part", "snippet,statistics,contentDetails")
      url.searchParams.set("chart", "mostPopular")
      url.searchParams.set("videoCategoryId", "10")
      url.searchParams.set("regionCode", "US")
      url.searchParams.set("maxResults", maxResults.toString())
      url.searchParams.set("key", this.apiKey)

      console.log("[v0] Making trending API request to:", url.toString().replace(this.apiKey, "***API_KEY***"))

      const response = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          "User-Agent": "VibeTune/1.0",
        },
      })

      console.log("[v0] Trending API response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.log("[v0] Trending API error response:", errorText)

        if (response.status === 403) {
          console.log("[v0] 403 error - marking quota as exceeded")
          this.markQuotaExceeded()
          return FALLBACK_TRENDING_SONGS.slice(0, maxResults)
        }
        throw new Error(`YouTube API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log("[v0] Trending API returned", data.items?.length || 0, "items")

      const videos = this.parseTrendingResults(data.items || [])
      console.log("[v0] Parsed", videos.length, "trending videos")

      return videos
    } catch (error) {
      console.error("[v0] YouTube API getTrendingMusic error:", error)
      console.log("[v0] Returning fallback trending data due to error")
      return FALLBACK_TRENDING_SONGS.slice(0, maxResults)
    }
  }

  async getPlaylistVideos(playlistId: string, maxResults?: number): Promise<YouTubeVideo[]> {
    console.log("[v0] Starting getPlaylistVideos for playlistId:", playlistId, "with unlimited loading")

    if (this.isQuotaExceeded()) {
      console.log("[v0] Quota exceeded, returning fallback playlist data")
      return FALLBACK_TRENDING_SONGS.slice(0, maxResults || 50)
    }

    try {
      const allVideos: YouTubeVideo[] = []
      let nextPageToken: string | undefined = undefined
      let pageCount = 0
      const maxPages = 100 // Safety limit to prevent infinite loops

      do {
        const url = new URL(`${this.baseUrl}/playlistItems`)
        url.searchParams.set("part", "snippet")
        url.searchParams.set("playlistId", playlistId)
        url.searchParams.set("maxResults", "50") // YouTube API max per request
        url.searchParams.set("key", this.apiKey)

        if (nextPageToken) {
          url.searchParams.set("pageToken", nextPageToken)
        }

        console.log(
          `[v0] Making playlist API request (page ${pageCount + 1}) to:`,
          url.toString().replace(this.apiKey, "***API_KEY***"),
        )

        const response = await fetch(url.toString(), {
          headers: {
            Accept: "application/json",
            "User-Agent": "VibeTune/1.0",
          },
        })

        console.log("[v0] Playlist API response status:", response.status)

        if (!response.ok) {
          const errorText = await response.text()
          console.log("[v0] Playlist API error response:", errorText)

          if (response.status === 403) {
            console.log("[v0] 403 error - marking quota as exceeded")
            this.markQuotaExceeded()
            return allVideos.length > 0 ? allVideos : FALLBACK_TRENDING_SONGS.slice(0, maxResults || 50)
          }
          throw new Error(`YouTube API error: ${response.status} - ${errorText}`)
        }

        const data = await response.json()
        console.log("[v0] Playlist API returned", data.items?.length || 0, "items on page", pageCount + 1)

        const pageVideos = this.parsePlaylistResults(data.items || [])
        allVideos.push(...pageVideos)

        nextPageToken = data.nextPageToken
        pageCount++

        console.log(`[v0] Total videos collected so far: ${allVideos.length}`)

        // If maxResults is specified and we've reached it, break
        if (maxResults && allVideos.length >= maxResults) {
          console.log(`[v0] Reached maxResults limit of ${maxResults}, stopping pagination`)
          break
        }
      } while (nextPageToken && pageCount < maxPages)

      console.log(`[v0] Finished loading playlist. Total videos: ${allVideos.length}, Pages fetched: ${pageCount}`)

      // If maxResults is specified, slice to that limit
      const finalVideos = maxResults ? allVideos.slice(0, maxResults) : allVideos
      console.log("[v0] Returning", finalVideos.length, "playlist videos")

      return finalVideos
    } catch (error) {
      console.error("[v0] YouTube API getPlaylistVideos error:", error)
      console.log("[v0] Returning fallback playlist data due to error")
      return FALLBACK_TRENDING_SONGS.slice(0, maxResults || 50)
    }
  }

  async getUserPlaylists(accessToken: string, maxResults = 25): Promise<YouTubePlaylist[]> {
    try {
      const url = new URL(`${this.baseUrl}/playlists`)
      url.searchParams.set("part", "snippet,contentDetails")
      url.searchParams.set("mine", "true")
      url.searchParams.set("maxResults", maxResults.toString())
      url.searchParams.set("key", this.apiKey)

      console.log("[v0] Making user playlists API request to:", url.toString().replace(this.apiKey, "***API_KEY***"))

      const response = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": "VibeTune/1.0",
        },
      })

      console.log("[v0] User playlists API response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.log("[v0] User playlists API error response:", errorText)
        throw new Error(`YouTube API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log("[v0] User playlists API returned", data.items?.length || 0, "items")

      const playlists = this.parsePlaylistsResults(data.items || [])
      console.log("[v0] Parsed", playlists.length, "user playlists")

      return playlists
    } catch (error) {
      console.error("[v0] User playlists error:", error)
      throw error
    }
  }

  async getLikedVideos(accessToken: string, maxResults = 50): Promise<YouTubeVideo[]> {
    try {
      const url = new URL(`${this.baseUrl}/videos`)
      url.searchParams.set("part", "snippet,statistics,contentDetails")
      url.searchParams.set("myRating", "like")
      url.searchParams.set("maxResults", maxResults.toString())
      url.searchParams.set("key", this.apiKey)

      console.log("[v0] Making liked videos API request to:", url.toString().replace(this.apiKey, "***API_KEY***"))

      const response = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": "VibeTune/1.0",
        },
      })

      console.log("[v0] Liked videos API response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.log("[v0] Liked videos API error response:", errorText)
        throw new Error(`YouTube API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log("[v0] Liked videos API returned", data.items?.length || 0, "items")

      const videos = this.parseTrendingResults(data.items || [])
      console.log("[v0] Parsed", videos.length, "liked videos")

      return videos
    } catch (error) {
      console.error("[v0] Liked videos error:", error)
      throw error
    }
  }

  async searchMusicEnhanced(query: string, maxResults = 20, pageToken?: string): Promise<EnhancedSearchResult> {
    console.log("[v0] Starting enhanced searchMusic for query:", query, "pageToken:", pageToken)

    if (this.isQuotaExceeded()) {
      console.log("[v0] Quota exceeded, returning fallback data")
      return {
        songs: FALLBACK_SEARCH_SONGS.slice(0, maxResults),
        artists: [],
        albums: [],
        playlists: [],
        nextPageToken: undefined,
      }
    }

    try {
      // Search for videos (songs) with pagination
      const videoResults = await this.searchMusicWithPagination(query, maxResults, pageToken)

      // Search for channels (artists) - only on first page
      const artistResults = !pageToken ? await this.searchArtists(query, Math.min(maxResults / 2, 10)) : []

      // Search for playlists (albums/playlists) - only on first page
      const playlistResults = !pageToken ? await this.searchPlaylists(query, Math.min(maxResults / 2, 10)) : []

      // Categorize playlists into albums and playlists
      const albums: YouTubeAlbum[] = []
      const playlists: YouTubePlaylist[] = []

      playlistResults.forEach((playlist) => {
        const title = playlist.title.toLowerCase()
        if (title.includes("album") || title.includes("full album") || title.includes("complete album")) {
          albums.push({
            id: playlist.id,
            title: playlist.title,
            artist: this.extractArtistFromPlaylistTitle(playlist.title),
            thumbnail: playlist.thumbnail,
            videoCount: playlist.videoCount,
            publishedAt: playlist.publishedAt,
            type: "album",
          })
        } else {
          playlists.push(playlist)
        }
      })

      return {
        songs: videoResults.videos,
        artists: artistResults,
        albums: albums,
        playlists: playlists,
        nextPageToken: videoResults.nextPageToken,
      }
    } catch (error) {
      console.error("[v0] Enhanced search error:", error)
      return {
        songs: FALLBACK_SEARCH_SONGS.slice(0, maxResults),
        artists: [],
        albums: [],
        playlists: [],
        nextPageToken: undefined,
      }
    }
  }

  async searchArtists(query: string, maxResults = 10): Promise<YouTubeArtist[]> {
    try {
      const url = new URL(`${this.baseUrl}/search`)
      url.searchParams.set("part", "snippet")
      url.searchParams.set("q", `${query} artist musician band singer`)
      url.searchParams.set("type", "channel")
      url.searchParams.set("maxResults", maxResults.toString())
      url.searchParams.set("order", "relevance")
      url.searchParams.set("key", this.apiKey)

      const response = await fetch(url.toString())

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`)
      }

      const data = await response.json()
      return this.parseArtistResults(data.items || [])
    } catch (error) {
      console.error("[v0] Artist search error:", error)
      return []
    }
  }

  async searchPlaylists(query: string, maxResults = 10): Promise<YouTubePlaylist[]> {
    try {
      const url = new URL(`${this.baseUrl}/search`)
      url.searchParams.set("part", "snippet")
      url.searchParams.set("q", `${query} album playlist collection`)
      url.searchParams.set("type", "playlist")
      url.searchParams.set("maxResults", maxResults.toString())
      url.searchParams.set("order", "relevance")
      url.searchParams.set("key", this.apiKey)

      const response = await fetch(url.toString())

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`)
      }

      const data = await response.json()
      return this.parsePlaylistSearchResults(data.items || [])
    } catch (error) {
      console.error("[v0] Playlist search error:", error)
      return []
    }
  }

  async searchArtistSongs(artistName: string, maxResults = 20, pageToken?: string): Promise<YouTubeSearchResult> {
    console.log("[v0] Starting searchArtistSongs for artist:", artistName)

    if (this.isQuotaExceeded()) {
      console.log("[v0] Quota exceeded, returning fallback data")
      return {
        videos: FALLBACK_SEARCH_SONGS.filter((song) =>
          song.channelTitle.toLowerCase().includes(artistName.toLowerCase()),
        ).slice(0, maxResults),
        nextPageToken: undefined,
      }
    }

    try {
      const url = new URL(`${this.baseUrl}/search`)
      url.searchParams.set("part", "snippet")
      // Enhanced query for artist-specific songs
      const artistQuery = `"${artistName}" songs music official audio track`
      url.searchParams.set("q", artistQuery)
      url.searchParams.set("type", "video")
      url.searchParams.set("maxResults", Math.min(maxResults * 3, 50).toString()) // Get more to filter better
      url.searchParams.set("order", "relevance")
      url.searchParams.set("videoDuration", "medium")
      url.searchParams.set("videoDefinition", "any")
      url.searchParams.set("videoCategoryId", "10") // Music category
      url.searchParams.set("key", this.apiKey)

      if (pageToken) {
        url.searchParams.set("pageToken", pageToken)
      }

      console.log("[v0] Making artist songs API request to:", url.toString().replace(this.apiKey, "***API_KEY***"))

      const response = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          "User-Agent": "VibeTune/1.0",
        },
      })

      console.log("[v0] Artist songs API response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.log("[v0] Artist songs API error response:", errorText)

        if (response.status === 403) {
          this.markQuotaExceeded()
          return {
            videos: FALLBACK_SEARCH_SONGS.filter((song) =>
              song.channelTitle.toLowerCase().includes(artistName.toLowerCase()),
            ).slice(0, maxResults),
            nextPageToken: undefined,
          }
        }
        throw new Error(`YouTube API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log("[v0] Artist songs API returned", data.items?.length || 0, "items")

      const videos = this.parseSearchResults(data.items || [])
      const artistFilteredVideos = this.filterArtistContent(videos, artistName)
      const finalVideos = artistFilteredVideos.slice(0, maxResults)

      console.log("[v0] Filtered to", finalVideos.length, "artist-specific songs")

      return {
        videos: finalVideos,
        nextPageToken: data.nextPageToken,
      }
    } catch (error) {
      console.error("[v0] YouTube API searchArtistSongs error:", error)
      return {
        videos: FALLBACK_SEARCH_SONGS.filter((song) =>
          song.channelTitle.toLowerCase().includes(artistName.toLowerCase()),
        ).slice(0, maxResults),
        nextPageToken: undefined,
      }
    }
  }

  async getPlaylistDetails(playlistId: string): Promise<{ playlist: YouTubePlaylist; videos: YouTubeVideo[] }> {
    console.log("[v0] Starting getPlaylistDetails for playlistId:", playlistId)

    if (this.isQuotaExceeded()) {
      console.log("[v0] Quota exceeded, returning fallback playlist details")
      return {
        playlist: {
          id: playlistId,
          title: "Sample Playlist",
          description: "A sample playlist",
          thumbnail: "/placeholder.svg?height=300&width=300",
          videoCount: 10,
          privacy: "public",
          publishedAt: new Date().toISOString(),
        },
        videos: FALLBACK_TRENDING_SONGS.slice(0, 10),
      }
    }

    try {
      // First, get playlist metadata
      const playlistUrl = new URL(`${this.baseUrl}/playlists`)
      playlistUrl.searchParams.set("part", "snippet,contentDetails")
      playlistUrl.searchParams.set("id", playlistId)
      playlistUrl.searchParams.set("key", this.apiKey)

      console.log(
        "[v0] Making playlist metadata API request to:",
        playlistUrl.toString().replace(this.apiKey, "***API_KEY***"),
      )

      const playlistResponse = await fetch(playlistUrl.toString(), {
        headers: {
          Accept: "application/json",
          "User-Agent": "VibeTune/1.0",
        },
      })

      console.log("[v0] Playlist metadata API response status:", playlistResponse.status)

      if (!playlistResponse.ok) {
        const errorText = await playlistResponse.text()
        console.log("[v0] Playlist metadata API error response:", errorText)

        if (playlistResponse.status === 403) {
          console.log("[v0] 403 error - marking quota as exceeded")
          this.markQuotaExceeded()
          return {
            playlist: {
              id: playlistId,
              title: "Sample Playlist",
              description: "A sample playlist",
              thumbnail: "/placeholder.svg?height=300&width=300",
              videoCount: 10,
              privacy: "public",
              publishedAt: new Date().toISOString(),
            },
            videos: FALLBACK_TRENDING_SONGS.slice(0, 10),
          }
        }
        throw new Error(`YouTube API error: ${playlistResponse.status} - ${errorText}`)
      }

      const playlistData = await playlistResponse.json()
      console.log("[v0] Playlist metadata API returned", playlistData.items?.length || 0, "playlists")

      if (!playlistData.items || playlistData.items.length === 0) {
        throw new Error("Playlist not found")
      }

      const playlistInfo = this.parsePlaylistsResults(playlistData.items)[0]

      const videos = await this.getPlaylistVideos(playlistId)

      console.log("[v0] Successfully fetched playlist details with", videos.length, "videos (unlimited)")

      return {
        playlist: playlistInfo,
        videos: videos,
      }
    } catch (error) {
      console.error("[v0] YouTube API getPlaylistDetails error:", error)
      throw error
    }
  }

  private async searchMusicWithPagination(
    query: string,
    maxResults = 20,
    pageToken?: string,
  ): Promise<YouTubeSearchResult> {
    const url = new URL(`${this.baseUrl}/search`)
    url.searchParams.set("part", "snippet")
    const musicQuery = `${query} official music video song`
    url.searchParams.set("q", musicQuery)
    url.searchParams.set("type", "video")
    url.searchParams.set("maxResults", Math.min(maxResults * 2, 50).toString())
    url.searchParams.set("order", "relevance")
    url.searchParams.set("videoDuration", "medium")
    url.searchParams.set("videoDefinition", "any")
    url.searchParams.set("videoCategoryId", "10")
    url.searchParams.set("key", this.apiKey)

    if (pageToken) {
      url.searchParams.set("pageToken", pageToken)
    }

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "VibeTune/1.0",
      },
    })

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`)
    }

    const data = await response.json()
    const videos = this.parseSearchResults(data.items || [])
    const filteredVideos = this.filterMusicContent(videos).slice(0, maxResults)

    return {
      videos: filteredVideos,
      nextPageToken: data.nextPageToken,
    }
  }

  private parseSearchResults(items: any[]): YouTubeVideo[] {
    return items.map((item) => ({
      id: item.id?.videoId || item.id,
      title: item.snippet?.title || "Unknown Title",
      channelTitle: item.snippet?.channelTitle || "Unknown Channel",
      thumbnail:
        item.snippet?.thumbnails?.high?.url ||
        item.snippet?.thumbnails?.medium?.url ||
        item.snippet?.thumbnails?.default?.url ||
        "/placeholder.svg?height=300&width=300",
      duration: "3:30",
      viewCount: "0",
      publishedAt: item.snippet?.publishedAt || new Date().toISOString(),
    }))
  }

  private parseTrendingResults(items: any[]): YouTubeVideo[] {
    return items.map((item) => ({
      id: item.id,
      title: item.snippet?.title || "Unknown Title",
      channelTitle: item.snippet?.channelTitle || "Unknown Channel",
      thumbnail:
        item.snippet?.thumbnails?.high?.url ||
        item.snippet?.thumbnails?.medium?.url ||
        item.snippet?.thumbnails?.default?.url ||
        "/placeholder.svg?height=300&width=300",
      duration: this.formatDuration(item.contentDetails?.duration || "PT3M30S"),
      viewCount: item.statistics?.viewCount || "0",
      publishedAt: item.snippet?.publishedAt || new Date().toISOString(),
    }))
  }

  private parsePlaylistResults(items: any[]): YouTubeVideo[] {
    return items.map((item) => ({
      id: item.snippet?.resourceId?.videoId || "",
      title: item.snippet?.title || "Unknown Title",
      channelTitle: item.snippet?.videoOwnerChannelTitle || item.snippet?.channelTitle || "Unknown Channel",
      thumbnail:
        item.snippet?.thumbnails?.high?.url ||
        item.snippet?.thumbnails?.medium?.url ||
        item.snippet?.thumbnails?.default?.url ||
        "/placeholder.svg?height=300&width=300",
      duration: "3:30",
      viewCount: "0",
      publishedAt: item.snippet?.publishedAt || new Date().toISOString(),
    }))
  }

  private parsePlaylistsResults(items: any[]): YouTubePlaylist[] {
    return items.map((item) => ({
      id: item.id,
      title: item.snippet?.title || "Unknown Playlist",
      description: item.snippet?.description || "",
      thumbnail:
        item.snippet?.thumbnails?.high?.url ||
        item.snippet?.thumbnails?.medium?.url ||
        item.snippet?.thumbnails?.default?.url ||
        "/placeholder.svg?height=300&width=300",
      videoCount: item.contentDetails?.itemCount || 0,
      privacy: item.status?.privacyStatus || "private",
      publishedAt: item.snippet?.publishedAt || new Date().toISOString(),
    }))
  }

  private parseArtistResults(items: any[]): YouTubeArtist[] {
    return items
      .filter((item) => this.isLikelyMusicArtist(item))
      .map((item) => ({
        id: item.id?.channelId || item.id,
        name: item.snippet?.title || "Unknown Artist",
        thumbnail:
          item.snippet?.thumbnails?.high?.url ||
          item.snippet?.thumbnails?.medium?.url ||
          item.snippet?.thumbnails?.default?.url ||
          "/placeholder.svg?height=300&width=300",
        description: item.snippet?.description || "",
        type: "artist" as const,
      }))
  }

  private parsePlaylistSearchResults(items: any[]): YouTubePlaylist[] {
    return items.map((item) => ({
      id: item.id?.playlistId || item.id,
      title: item.snippet?.title || "Unknown Playlist",
      description: item.snippet?.description || "",
      thumbnail:
        item.snippet?.thumbnails?.high?.url ||
        item.snippet?.thumbnails?.medium?.url ||
        item.snippet?.thumbnails?.default?.url ||
        "/placeholder.svg?height=300&width=300",
      videoCount: 0, // This would need a separate API call to get accurate count
      privacy: "public",
      publishedAt: item.snippet?.publishedAt || new Date().toISOString(),
    }))
  }

  private formatDuration(isoDuration: string): string {
    if (!isoDuration) return "3:30"

    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return "3:30"

    const hours = Number.parseInt(match[1] || "0")
    const minutes = Number.parseInt(match[2] || "0")
    const seconds = Number.parseInt(match[3] || "0")

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    }

    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  private filterMusicContent(videos: YouTubeVideo[]): YouTubeVideo[] {
    const musicKeywords = [
      "official",
      "music",
      "song",
      "audio",
      "track",
      "album",
      "single",
      "remix",
      "cover",
      "acoustic",
      "live",
      "performance",
      "concert",
      "studio",
      "version",
      "ft.",
      "feat.",
      "featuring",
      "vevo",
      "records",
      "music video",
      "mv",
      "lyric",
      "lyrics",
      "instrumental",
      "karaoke",
      "unplugged",
      "sessions",
      "radio edit",
      "extended",
      "original mix",
      "clean version",
      "explicit",
    ]

    const highPriorityKeywords = [
      "vevo",
      "official",
      "music video",
      "official video",
      "official audio",
      "official music video",
    ]

    const musicChannelKeywords = ["vevo", "records", "music", "entertainment", "official", "label", "studios"]

    const nonMusicKeywords = [
      "tutorial",
      "how to",
      "review",
      "reaction",
      "vlog",
      "interview",
      "documentary",
      "news",
      "talk show",
      "podcast",
      "gameplay",
      "unboxing",
      "behind the scenes",
      "making of",
      "explained",
      "theory",
      "lesson",
      "course",
    ]

    return videos
      .map((video) => {
        const title = video.title.toLowerCase()
        const channelTitle = video.channelTitle.toLowerCase()
        let score = 0

        // High priority content
        highPriorityKeywords.forEach((keyword) => {
          if (title.includes(keyword) || channelTitle.includes(keyword)) {
            score += 10
          }
        })

        // Music channel bonus
        musicChannelKeywords.forEach((keyword) => {
          if (channelTitle.includes(keyword)) {
            score += 5
          }
        })

        // General music keywords
        musicKeywords.forEach((keyword) => {
          if (title.includes(keyword) || channelTitle.includes(keyword)) {
            score += 2
          }
        })

        // Penalty for non-music content
        nonMusicKeywords.forEach((keyword) => {
          if (title.includes(keyword)) {
            score -= 5
          }
        })

        return { ...video, score }
      })
      .filter((video) => {
        // Only include videos with positive music score
        return video.score > 0
      })
      .sort((a, b) => b.score - a.score) // Sort by music relevance score
      .map(({ score, ...video }) => video) // Remove score from final result
  }

  private filterArtistContent(videos: YouTubeVideo[], artistName: string): YouTubeVideo[] {
    const normalizedArtistName = artistName.toLowerCase()

    return videos
      .map((video) => {
        const title = video.title.toLowerCase()
        const channelTitle = video.channelTitle.toLowerCase()
        let score = 0

        // Exact artist name match in channel title (highest priority)
        if (channelTitle.includes(normalizedArtistName)) {
          score += 20
        }

        // Artist name in title
        if (title.includes(normalizedArtistName)) {
          score += 15
        }

        // Official content bonus
        if (title.includes("official") || channelTitle.includes("official")) {
          score += 10
        }

        // VEVO or record label bonus
        if (channelTitle.includes("vevo") || channelTitle.includes("records")) {
          score += 8
        }

        // Music keywords bonus
        const musicKeywords = ["music video", "official video", "official audio", "song", "track"]
        musicKeywords.forEach((keyword) => {
          if (title.includes(keyword)) {
            score += 5
          }
        })

        // Penalty for covers, remixes by other artists (unless it's the original artist)
        if ((title.includes("cover") || title.includes("remix")) && !channelTitle.includes(normalizedArtistName)) {
          score -= 10
        }

        // Penalty for reaction videos, tutorials, etc.
        const penaltyKeywords = ["reaction", "tutorial", "how to", "review", "breakdown", "analysis"]
        penaltyKeywords.forEach((keyword) => {
          if (title.includes(keyword)) {
            score -= 15
          }
        })

        return { ...video, score }
      })
      .filter((video) => video.score > 0) // Only include videos with positive score
      .sort((a, b) => b.score - a.score) // Sort by relevance score
      .map(({ score, ...video }) => video) // Remove score from final result
  }

  private isLikelyMusicArtist(channelItem: any): boolean {
    const title = (channelItem.snippet?.title || "").toLowerCase()
    const description = (channelItem.snippet?.description || "").toLowerCase()

    const musicKeywords = [
      "official",
      "music",
      "artist",
      "band",
      "singer",
      "musician",
      "records",
      "entertainment",
      "vevo",
      "label",
      "studios",
    ]

    const nonMusicKeywords = [
      "news",
      "gaming",
      "tech",
      "tutorial",
      "vlog",
      "comedy",
      "sports",
      "cooking",
      "travel",
      "review",
    ]

    const hasMusicKeywords = musicKeywords.some((keyword) => title.includes(keyword) || description.includes(keyword))

    const hasNonMusicKeywords = nonMusicKeywords.some(
      (keyword) => title.includes(keyword) || description.includes(keyword),
    )

    return hasMusicKeywords && !hasNonMusicKeywords
  }

  private extractArtistFromPlaylistTitle(title: string): string {
    // Try to extract artist name from common album title patterns
    const patterns = [
      /^(.+?)\s*-\s*(.+?)(?:\s*$$.*$$)?$/, // "Artist - Album" or "Artist - Album (Year)"
      /^(.+?)\s*:\s*(.+?)$/, // "Artist: Album"
      /^(.+?)\s+by\s+(.+?)$/i, // "Album by Artist"
    ]

    for (const pattern of patterns) {
      const match = title.match(pattern)
      if (match) {
        // Return the first capture group (usually the artist)
        return match[1].trim()
      }
    }

    // If no pattern matches, try to extract from common keywords
    const words = title.split(/\s+/)
    const stopIndex = words.findIndex((word) =>
      ["album", "full", "complete", "collection", "best", "greatest"].includes(word.toLowerCase()),
    )

    if (stopIndex > 0) {
      return words.slice(0, stopIndex).join(" ")
    }

    return "Unknown Artist"
  }

  private getFallbackResults(query: string, maxResults: number): YouTubeSearchResult {
    const queryLower = query.toLowerCase()
    console.log("[v0] Getting fallback results for query:", query)
    console.log("[v0] Query lowercase:", queryLower)

    let fallbackSongs: YouTubeVideo[] | undefined

    // Direct category key matching
    const categoryKey = queryLower.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
    console.log("[v0] Generated category key:", categoryKey)
    fallbackSongs = CATEGORY_SPECIFIC_FALLBACK[categoryKey]

    if (fallbackSongs) {
      console.log("[v0] Found direct category match:", categoryKey, "with", fallbackSongs.length, "songs")
    }

    // Enhanced keyword-based matching for better category detection
    if (!fallbackSongs) {
      console.log("[v0] No direct category match, trying keyword matching")
      const categoryMappings: Record<string, string[]> = {
        "hip-hop-classics": [
          "notorious",
          "biggie",
          "tupac",
          "2pac",
          "nas",
          "eminem",
          "hip hop",
          "rap classic",
          "90s hip hop",
          "hip-hop legend",
        ],
        "r-b-party-starters": ["destiny", "beyonce", "usher", "r&b", "rnb", "party r&b", "dance r&b", "r&b hits"],
        "classic-pop-party": ["queen", "abba", "blondie", "80s pop", "classic pop", "pop party", "retro pop"],
        "happy-pop-hits": ["happy", "upbeat", "feel good", "pop hits", "cheerful", "positive", "energetic pop"],
        "80s-sing-alongs": ["80s", "eighties", "sing along", "karaoke", "80s hits", "retro"],
        "feel-good-pop-rock": ["feel good", "uplifting", "positive", "pop rock", "happy rock", "ed sheeran"],
        "feel-good-r-b-vibes": ["feel good r&b", "smooth r&b", "chill r&b", "bruno mars", "weeknd", "lizzo"],
      }

      for (const [category, keywords] of Object.entries(categoryMappings)) {
        const matchedKeywords = keywords.filter((keyword) => queryLower.includes(keyword))
        if (matchedKeywords.length > 0) {
          fallbackSongs = CATEGORY_SPECIFIC_FALLBACK[category]
          console.log("[v0] Matched query to category:", category, "via keywords:", matchedKeywords)
          break
        }
      }
    }

    // Fallback to partial matching if no keyword match found
    if (!fallbackSongs) {
      console.log("[v0] No keyword match, trying partial matching")
      const categoryKeys = Object.keys(CATEGORY_SPECIFIC_FALLBACK)
      const matchingCategory = categoryKeys.find(
        (key) =>
          key.includes(categoryKey) ||
          categoryKey.includes(key) ||
          queryLower.split(" ").some((word) => key.includes(word) && word.length > 2),
      )

      if (matchingCategory) {
        fallbackSongs = CATEGORY_SPECIFIC_FALLBACK[matchingCategory]
        console.log("[v0] Matched query to category:", matchingCategory, "via partial matching")
      }
    }

    // If no category-specific songs found, use general fallback with filtering
    if (!fallbackSongs) {
      console.log("[v0] No category-specific match found, using general fallback")
      const filteredFallback = FALLBACK_SEARCH_SONGS.filter(
        (song) =>
          song.title.toLowerCase().includes(queryLower) ||
          song.channelTitle.toLowerCase().includes(queryLower) ||
          queryLower
            .split(" ")
            .some((word) => song.title.toLowerCase().includes(word) || song.channelTitle.toLowerCase().includes(word)),
      )

      fallbackSongs = filteredFallback.length > 0 ? filteredFallback : FALLBACK_SEARCH_SONGS
      console.log("[v0] Using general fallback songs with filtering, found", fallbackSongs.length, "songs")
    }

    console.log(
      "[v0] Returning",
      Math.min(fallbackSongs.length, maxResults),
      "fallback results for query:",
      query,
      "Category-specific:",
      fallbackSongs !== FALLBACK_SEARCH_SONGS,
    )

    return {
      videos: fallbackSongs.slice(0, maxResults),
      nextPageToken: undefined,
    }
  }

  private async getVideoDetails(videoIds: string[]): Promise<YouTubeVideo[]> {
    if (videoIds.length === 0) return []

    try {
      const url = new URL(`${this.baseUrl}/videos`)
      url.searchParams.set("part", "snippet,contentDetails,statistics")
      url.searchParams.set("id", videoIds.join(","))
      url.searchParams.set("key", this.apiKey)

      const response = await fetch(url.toString())

      if (!response.ok) {
        if (response.status === 403) {
          const errorData = await response.json().catch(() => null)
          if (errorData?.error?.errors?.[0]?.reason === "quotaExceeded") {
            console.log("[v0] Quota exceeded in getVideoDetails - using fallback data")
            this.markQuotaExceeded()
            // Return fallback video data instead of throwing error
            return videoIds.map((id) => ({
              id,
              title: "Music Video",
              channelTitle: "Various Artists",
              thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
              duration: "3:30",
              viewCount: "1000000",
              publishedAt: new Date().toISOString(),
            }))
          }
        }
        console.error("[v0] Error fetching video details:", response.status)
        return this.parseSearchResults(videoIds.map((id) => ({ id: { videoId: id }, snippet: {} })))
      }

      const data = await response.json()

      return data.items.map((item: any) => ({
        id: item.id,
        title: item.snippet?.title || "Unknown Title",
        channelTitle: item.snippet?.channelTitle || "Unknown Channel",
        thumbnail:
          item.snippet?.thumbnails?.high?.url ||
          item.snippet?.thumbnails?.medium?.url ||
          item.snippet?.thumbnails?.default?.url ||
          "/placeholder.svg?height=300&width=300",
        duration: this.formatDuration(item.contentDetails?.duration) || "3:30",
        viewCount: item.statistics?.viewCount || "0",
        publishedAt: item.snippet?.publishedAt || new Date().toISOString(),
      }))
    } catch (error) {
      console.error("[v0] Error getting video details:", error)
      return videoIds.map((id) => ({
        id,
        title: "Music Video",
        channelTitle: "Various Artists",
        thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
        duration: "3:30",
        viewCount: "1000000",
        publishedAt: new Date().toISOString(),
      }))
    }
  }
}

// Create a singleton instance
export const createYouTubeAPI = (apiKey?: string) => new YouTubeAPI(apiKey)

const defaultAPI = new YouTubeAPI()

export const searchMusic = async (query: string, maxResults = 20): Promise<YouTubeSearchResult> => {
  return await defaultAPI.searchMusic(query, maxResults)
}

export const fetchTrendingMusic = async (maxResults = 20): Promise<YouTubeVideo[]> => {
  return await defaultAPI.getTrendingMusic(maxResults)
}

export const fetchTrending = fetchTrendingMusic

export const searchMusicEnhanced = async (
  query: string,
  maxResults = 20,
  pageToken?: string,
): Promise<EnhancedSearchResult> => {
  return await defaultAPI.searchMusicEnhanced(query, maxResults, pageToken)
}

export const searchArtistSongs = async (
  artistName: string,
  maxResults = 20,
  pageToken?: string,
): Promise<YouTubeSearchResult> => {
  return await defaultAPI.searchArtistSongs(artistName, maxResults, pageToken)
}

export const getPlaylistDetails = async (
  playlistId: string,
): Promise<{ playlist: YouTubePlaylist; videos: YouTubeVideo[] }> => {
  return await defaultAPI.getPlaylistDetails(playlistId)
}
