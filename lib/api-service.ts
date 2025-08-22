export interface ApiConfig {
  baseUrl: string
  apiKey?: string
  headers?: Record<string, string>
}

export class VideoApiService {
  private config: ApiConfig

  constructor(config: ApiConfig) {
    this.config = config
  }

  async makeRequest(endpoint: string, params: Record<string, any> = {}) {
    const url = new URL(endpoint, this.config.baseUrl)

    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString())
      }
    })

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...this.config.headers,
    }

    // Add API key if provided
    if (this.config.apiKey) {
      headers["Authorization"] = `Bearer ${this.config.apiKey}`
      // Or use different auth method based on your API
      // headers['X-API-Key'] = this.config.apiKey
    }

    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        headers,
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("API Request failed:", error)
      throw error
    }
  }

  // Example method for your specific API
  async searchVideos(query: string, page = 1, limit = 20) {
    return this.makeRequest("/search", {
      q: query,
      page,
      limit,
      // Add other parameters your API needs
    })
  }

  async getTrending(page = 1, limit = 20) {
    return this.makeRequest("/trending", {
      page,
      limit,
    })
  }

  async getVideoById(id: string) {
    return this.makeRequest(`/gifs/${id}`)
  }
}

// Example usage:
// const apiService = new VideoApiService({
//   baseUrl: 'https://your-api-endpoint.com/v2',
//   apiKey: 'your-api-key', // if needed
//   headers: {
//     'User-Agent': 'VibeTune/1.0'
//   }
// })
