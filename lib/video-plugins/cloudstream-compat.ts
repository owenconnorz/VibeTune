// CloudStream compatibility layer for JavaScript
// Mimics the Kotlin CloudStream3 APIs for web-based extensions

// JSoup-like HTML parsing functionality
export class Element {
  private element: HTMLElement | Document

  constructor(element: HTMLElement | Document) {
    this.element = element
  }

  static parse(html: string): Element {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, "text/html")
    return new Element(doc)
  }

  select(selector: string): Element[] {
    const elements = this.element.querySelectorAll(selector)
    return Array.from(elements).map((el) => new Element(el as HTMLElement))
  }

  selectFirst(selector: string): Element | null {
    const element = this.element.querySelector(selector)
    return element ? new Element(element as HTMLElement) : null
  }

  text(): string {
    return this.element.textContent || ""
  }

  attr(name: string): string {
    if (this.element instanceof HTMLElement) {
      return this.element.getAttribute(name) || ""
    }
    return ""
  }

  html(): string {
    return this.element instanceof HTMLElement ? this.element.innerHTML : ""
  }

  hasClass(className: string): boolean {
    return this.element instanceof HTMLElement ? this.element.classList.contains(className) : false
  }
}

// CloudStream3-like data structures
export interface SearchResponse {
  name: string
  url: string
  apiName: string
  type?: TvType
  posterUrl?: string
  year?: number
  quality?: SearchQuality
}

export interface LoadResponse {
  name: string
  url: string
  apiName: string
  type: TvType
  posterUrl?: string
  year?: number
  plot?: string
  rating?: number
  tags?: string[]
  duration?: number
  actors?: ActorData[]
  recommendations?: SearchResponse[]
}

export interface ActorData {
  actor: Actor
  role?: string
}

export interface Actor {
  name: string
  image?: string
}

export enum TvType {
  Movie = "Movie",
  TvSeries = "TvSeries",
  Anime = "Anime",
  AnimeMovie = "AnimeMovie",
  AsianDrama = "AsianDrama",
}

export enum SearchQuality {
  HD = "HD",
  SD = "SD",
  UHD = "UHD",
  CAM = "CAM",
  HDCAM = "HDCAM",
}

// CloudStream3-like utility functions
export class CloudStreamUtils {
  static async get(url: string, headers?: Record<string, string>): Promise<string> {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          ...headers,
        },
      })
      return await response.text()
    } catch (error) {
      console.error("[v0] CloudStream fetch error:", error)
      throw error
    }
  }

  static async post(url: string, data?: any, headers?: Record<string, string>): Promise<string> {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          ...headers,
        },
        body: data ? JSON.stringify(data) : undefined,
      })
      return await response.text()
    } catch (error) {
      console.error("[v0] CloudStream POST error:", error)
      throw error
    }
  }

  static fixUrl(url: string, baseUrl: string): string {
    if (url.startsWith("http")) return url
    if (url.startsWith("//")) return "https:" + url
    if (url.startsWith("/")) return new URL(baseUrl).origin + url
    return new URL(url, baseUrl).href
  }

  static getQualityFromName(name: string): SearchQuality {
    const lowerName = name.toLowerCase()
    if (lowerName.includes("4k") || lowerName.includes("2160p")) return SearchQuality.UHD
    if (lowerName.includes("1080p") || lowerName.includes("hd")) return SearchQuality.HD
    if (lowerName.includes("cam")) return SearchQuality.CAM
    return SearchQuality.SD
  }
}

// Base CloudStream provider class
export abstract class CloudStreamProvider {
  abstract name: string
  abstract mainUrl: string
  abstract supportedTypes: TvType[]
  abstract hasMainPage: boolean

  abstract search(query: string): Promise<SearchResponse[]>
  abstract load(url: string): Promise<LoadResponse>
  abstract loadLinks(
    data: string,
    isCasting: boolean,
    subtitleCallback?: (file: any) => void,
    callback?: (link: any) => void,
  ): Promise<boolean>

  // Helper method to add actors to LoadResponse
  protected addActors(response: LoadResponse, actors: ActorData[]): LoadResponse {
    return {
      ...response,
      actors: [...(response.actors || []), ...actors],
    }
  }

  // Helper method to create actor data
  protected createActor(name: string, image?: string, role?: string): ActorData {
    return {
      actor: { name, image },
      role,
    }
  }
}

// Example CloudStream extension implementation
export class ExampleCloudStreamProvider extends CloudStreamProvider {
  name = "Example Provider"
  mainUrl = "https://example.com"
  supportedTypes = [TvType.Movie, TvType.TvSeries]
  hasMainPage = true

  async search(query: string): Promise<SearchResponse[]> {
    console.log("[v0] CloudStream search:", query)
    try {
      const searchUrl = `${this.mainUrl}/search?q=${encodeURIComponent(query)}`
      const html = await CloudStreamUtils.get(searchUrl)
      const doc = Element.parse(html)

      const results: SearchResponse[] = []
      const items = doc.select(".search-item")

      for (const item of items) {
        const titleEl = item.selectFirst(".title")
        const linkEl = item.selectFirst("a")
        const posterEl = item.selectFirst("img")

        if (titleEl && linkEl) {
          results.push({
            name: titleEl.text(),
            url: CloudStreamUtils.fixUrl(linkEl.attr("href"), this.mainUrl),
            apiName: this.name,
            type: TvType.Movie,
            posterUrl: posterEl ? CloudStreamUtils.fixUrl(posterEl.attr("src"), this.mainUrl) : undefined,
          })
        }
      }

      return results
    } catch (error) {
      console.error("[v0] CloudStream search error:", error)
      return []
    }
  }

  async load(url: string): Promise<LoadResponse> {
    console.log("[v0] CloudStream load:", url)
    try {
      const html = await CloudStreamUtils.get(url)
      const doc = Element.parse(html)

      const title = doc.selectFirst("h1")?.text() || "Unknown"
      const poster = doc.selectFirst(".poster img")?.attr("src")
      const plot = doc.selectFirst(".plot")?.text()

      // Extract actors
      const actors: ActorData[] = []
      const actorElements = doc.select(".cast .actor")
      for (const actorEl of actorElements) {
        const name = actorEl.selectFirst(".name")?.text()
        const image = actorEl.selectFirst("img")?.attr("src")
        const role = actorEl.selectFirst(".role")?.text()

        if (name) {
          actors.push(this.createActor(name, image, role))
        }
      }

      const response: LoadResponse = {
        name: title,
        url,
        apiName: this.name,
        type: TvType.Movie,
        posterUrl: poster ? CloudStreamUtils.fixUrl(poster, this.mainUrl) : undefined,
        plot,
        actors,
      }

      return response
    } catch (error) {
      console.error("[v0] CloudStream load error:", error)
      throw error
    }
  }

  async loadLinks(
    data: string,
    isCasting: boolean,
    subtitleCallback?: (file: any) => void,
    callback?: (link: any) => void,
  ): Promise<boolean> {
    console.log("[v0] CloudStream loadLinks:", data)
    // Implementation would extract video links from the page
    return false
  }
}
