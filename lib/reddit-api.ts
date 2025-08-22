import { RedditAuthService } from "./reddit-auth"

export interface RedditPost {
  id: string
  title: string
  author: string
  subreddit: string
  url: string
  thumbnail: string
  preview?: {
    images: Array<{
      source: {
        url: string
        width: number
        height: number
      }
    }>
  }
  media?: {
    reddit_video?: {
      fallback_url: string
      hls_url: string
      width: number
      height: number
    }
  }
  score: number
  num_comments: number
  created_utc: number
  is_video: boolean
  post_hint?: string
}

export interface RedditResponse {
  data: {
    children: Array<{
      data: RedditPost
    }>
    after?: string
    before?: string
  }
}

export class RedditApiService {
  private authService = RedditAuthService.getInstance()
  private baseUrl = "https://www.reddit.com"

  async makeRequest(endpoint: string, params: Record<string, any> = {}): Promise<RedditResponse> {
    try {
      // Use secure server-side API instead of direct Reddit calls
      const apiUrl = new URL(endpoint, window.location.origin)

      // Add query parameters
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          apiUrl.searchParams.append(key, value.toString())
        }
      })

      const headers: Record<string, string> = {
        Accept: "application/json",
        "Content-Type": "application/json",
      }

      const accessToken = await this.authService.getAccessToken()
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`
      }

      const response = await fetch(apiUrl.toString(), {
        method: "GET",
        headers,
      })

      if (!response.ok) {
        throw new Error(`Reddit API Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      // Transform server response to match expected format
      return {
        data: {
          children: data.posts.map((post: any) => ({ data: post })),
          after: data.after,
        },
      }
    } catch (error) {
      console.error("Reddit API Request failed:", error)
      return this.getFallbackData()
    }
  }

  private getFallbackData(): RedditResponse {
    return {
      data: {
        children: [
          {
            data: {
              id: "fallback1",
              title: "Amazing Street Performance Goes Viral",
              author: "musiclover123",
              subreddit: "videos",
              url: "https://reddit.com/r/videos",
              thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
              score: 1250,
              num_comments: 89,
              created_utc: Date.now() / 1000 - 3600,
              is_video: true,
              post_hint: "hosted:video",
            },
          },
          {
            data: {
              id: "fallback2",
              title: "Incredible Dance Moves Compilation",
              author: "dancefan456",
              subreddit: "gifs",
              url: "https://reddit.com/r/gifs",
              thumbnail: "https://img.youtube.com/vi/hT_nvWreIhg/hqdefault.jpg",
              score: 892,
              num_comments: 45,
              created_utc: Date.now() / 1000 - 7200,
              is_video: false,
              post_hint: "image",
            },
          },
          {
            data: {
              id: "fallback3",
              title: "Mind-Blowing Magic Trick Revealed",
              author: "magicfan789",
              subreddit: "interestingasfuck",
              url: "https://reddit.com/r/interestingasfuck",
              thumbnail: "https://img.youtube.com/vi/5RDSkR8_AQ0/hqdefault.jpg",
              score: 2341,
              num_comments: 156,
              created_utc: Date.now() / 1000 - 10800,
              is_video: true,
              post_hint: "hosted:video",
            },
          },
        ],
        after: "fallback_token",
      },
    }
  }

  async searchPosts(query: string, subreddit?: string, sort = "relevance", limit = 25, after?: string) {
    return this.makeRequest("/search", {
      q: query,
      subreddit,
      sort,
      limit,
      after,
    })
  }

  async getSubredditPosts(subreddit: string, sort = "hot", limit = 25, after?: string) {
    return this.makeRequest("/subreddit", {
      subreddit,
      sort,
      limit,
      after,
    })
  }

  async getTrendingPosts(limit = 25, after?: string) {
    return this.makeRequest("/trending", {
      subreddit: "popular",
      sort: "hot",
      limit,
      after,
    })
  }

  async getVideoSubreddits(limit = 25, after?: string) {
    const videoSubreddits = ["videos", "gifs", "funny", "interestingasfuck", "nextfuckinglevel"]
    const randomSubreddit = videoSubreddits[Math.floor(Math.random() * videoSubreddits.length)]

    return this.getSubredditPosts(randomSubreddit, "hot", limit, after)
  }

  async getAccessToken(): Promise<string | null> {
    return await this.authService.getAccessToken()
  }

  async isAuthenticated(): Promise<boolean> {
    return await this.authService.isAuthenticated()
  }

  logout(): void {
    this.authService.logout()
  }

  // Helper method to extract video/image URL from Reddit post
  getMediaUrl(post: RedditPost): string | null {
    // Reddit video
    if (post.media?.reddit_video?.fallback_url) {
      return post.media.reddit_video.fallback_url
    }

    // Preview images
    if (post.preview?.images?.[0]?.source?.url) {
      return post.preview.images[0].source.url.replace(/&amp;/g, "&")
    }

    // Thumbnail
    if (post.thumbnail && post.thumbnail !== "self" && post.thumbnail !== "default") {
      return post.thumbnail
    }

    return null
  }

  // Helper method to check if post has media content
  hasMediaContent(post: RedditPost): boolean {
    return !!(
      post.is_video ||
      post.post_hint === "image" ||
      post.media?.reddit_video ||
      post.preview?.images?.length ||
      (post.thumbnail && post.thumbnail !== "self" && post.thumbnail !== "default")
    )
  }
}
