export interface VideoSource {
  id: string
  title: string
  url: string
  videoUrl?: string
  embed?: string
  thumbnail: string
  duration: string
  durationSeconds: number
  views: number
  rating: number
  added: string
  keywords: string
  source: string
}

export interface SearchOptions {
  query?: string
  type?: string
  page?: number
  perPage?: number
  duration?: string
  category?: string
}

export interface SearchResult {
  videos: VideoSource[]
  totalCount: number
  currentPage: number
  hasNextPage: boolean
  error?: string
}

export interface VideoPlugin {
  // Plugin metadata
  id: string
  name: string
  version: string
  description: string
  author: string
  homepage?: string

  // Plugin capabilities
  supportedSearchTypes: Array<{
    value: string
    label: string
  }>

  // Core methods
  initialize(): Promise<void>
  search(options: SearchOptions): Promise<SearchResult>
  getVideoDetails?(videoId: string): Promise<VideoSource | null>

  // Optional methods
  getTrending?(): Promise<SearchResult>
  getCategories?(): Promise<Array<{ id: string; name: string }>>
  isEnabled(): boolean
  enable(): void
  disable(): void
}

export interface PluginManager {
  plugins: Map<string, VideoPlugin>
  registerPlugin(plugin: VideoPlugin): void
  unregisterPlugin(pluginId: string): void
  getPlugin(pluginId: string): VideoPlugin | undefined
  getEnabledPlugins(): VideoPlugin[]
  searchAll(options: SearchOptions): Promise<SearchResult>
}
