import { createYouTubeDataAPI } from "./youtube-data-api"

// Re-export the YouTube Data API as createMusicAPI for backward compatibility
export const createMusicAPI = createYouTubeDataAPI

// Re-export the YouTubeDataAPI class as MusicAPI for backward compatibility
export { YouTubeDataAPI as MusicAPI } from "./youtube-data-api"
