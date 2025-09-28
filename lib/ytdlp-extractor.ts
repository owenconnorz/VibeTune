import { spawn } from 'child_process';

export interface YtDlpSong {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: string;
  url: string;
  audioUrl: string;
  formats?: YtDlpFormat[];
}

export interface YtDlpFormat {
  format_id: string;
  url: string;
  ext: string;
  acodec: string;
  abr?: number;
  filesize?: number;
}

export interface YtDlpVideoInfo {
  id: string;
  title: string;
  uploader: string;
  thumbnail: string;
  duration: number;
  webpage_url: string;
  formats: YtDlpFormat[];
}

class YtDlpExtractor {
  private readonly YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'YOUR_YOUTUBE_API_KEY';
  private readonly YOUTUBE_BASE_URL = 'https://www.googleapis.com/youtube/v3';

  async getTrending(maxResults = 25): Promise<YtDlpSong[]> {
    console.log('[v0] YtDlp: Fetching trending music from YouTube API');

    try {
      const response = await fetch(
        `${this.YOUTUBE_BASE_URL}/videos?` +
          `part=snippet,contentDetails&` +
          `chart=mostPopular&` +
          `videoCategoryId=10&` + // Music category
          `regionCode=US&` +
          `maxResults=${maxResults}&` +
          `key=${this.YOUTUBE_API_KEY}`,
      );

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[v0] YtDlp: Got', data.items?.length || 0, 'trending videos from YouTube');

      if (!data.items || data.items.length === 0) {
        throw new Error('No trending videos from YouTube API');
      }

      const songs: YtDlpSong[] = [];
      for (const item of data.items.slice(0, Math.min(maxResults, 10))) {
        try {
          const videoInfo = await this.getVideoInfo(item.id);
          if (videoInfo) {
            const song = this.convertToSong(videoInfo, item);
            songs.push(song);
          }
        } catch (error) {
          console.error(`[v0] YtDlp: Failed to extract ${item.id}:`, error);
        }
      }

      console.log('[v0] YtDlp: Successfully extracted', songs.length, 'songs with audio URLs');
      return songs;
    } catch (error) {
      console.error('[v0] YtDlp: Trending failed:', error);
      throw error;
    }
  }

  async search(query: string, maxResults = 15): Promise<YtDlpSong[]> {
    console.log('[v0] YtDlp: Searching YouTube API for:', query);

    try {
      const response = await fetch(
        `${this.YOUTUBE_BASE_URL}/search?` +
          `part=snippet&` +
          `q=${encodeURIComponent(query + ' music')}&` +
          `type=video&` +
          `videoCategoryId=10&` +
          `maxResults=${maxResults}&` +
          `key=${this.YOUTUBE_API_KEY}`,
      );

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[v0] YtDlp: Got', data.items?.length || 0, 'search results from YouTube');

      if (!data.items || data.items.length === 0) {
        return [];
      }

      const songs: YtDlpSong[] = [];
      for (const item of data.items.slice(0, Math.min(maxResults, 8))) {
        try {
          const videoInfo = await this.getVideoInfo(item.id.videoId);
          if (videoInfo) {
            const song = this.convertToSong(videoInfo, item);
            songs.push(song);
          }
        } catch (error) {
          console.error(`[v0] YtDlp: Failed to extract ${item.id.videoId}:`, error);
        }
      }

      console.log('[v0] YtDlp: Successfully extracted', songs.length, 'search results with audio URLs');
      return songs;
    } catch (error) {
      console.error('[v0] YtDlp: Search failed:', error);
      throw error;
    }
  }

  async getVideoInfo(videoId: string): Promise<YtDlpVideoInfo | null> {
    console.log('[v0] YtDlp: Extracting video info for:', videoId);

    return new Promise((resolve, reject) => {
      const ytDlpProcess = spawn('yt-dlp', [
        '--dump-json',
        '--no-playlist',
        '--format',
        'bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio',
        `https://www.youtube.com/watch?v=${videoId}`,
      ]);

      let stdout = '';
      let stderr = '';

      ytDlpProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      ytDlpProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ytDlpProcess.on('close', (code) => {
        if (code === 0 && stdout.trim()) {
          try {
            const videoInfo = JSON.parse(stdout.trim());
            console.log('[v0] YtDlp: Successfully extracted info for:', videoId);
            resolve(videoInfo);
          } catch (error) {
            console.error('[v0] YtDlp: JSON parse error for:', videoId, error);
            resolve(null);
          }
        } else {
          console.error('[v0] YtDlp: Extraction failed for:', videoId, 'Code:', code, 'Error:', stderr);
          resolve(null);
        }
      });

      ytDlpProcess.on('error', (error) => {
        console.error('[v0] YtDlp: Process error for:', videoId, error);
        resolve(null);
      });

      setTimeout(() => {
        ytDlpProcess.kill();
        console.error('[v0] YtDlp: Timeout for:', videoId);
        resolve(null);
      }, 30000);
    });
  }

  private convertToSong(videoInfo: YtDlpVideoInfo, youtubeItem?: any): YtDlpSong {
    const audioFormats = videoInfo.formats?.filter((f) => f.acodec && f.acodec !== 'none' && f.url) || [];

    const bestAudio =
      audioFormats.find((f) => f.ext === 'm4a') || audioFormats.find((f) => f.ext === 'webm') || audioFormats[0];

    return {
      id: videoInfo.id,
      title: videoInfo.title,
      artist: videoInfo.uploader || 'Unknown Artist',
      thumbnail: videoInfo.thumbnail || '',
      duration: this.formatDuration(videoInfo.duration || 0),
      url: videoInfo.webpage_url,
      audioUrl: bestAudio?.url || '',
      formats: audioFormats,
    };
  }

  private formatDuration(seconds: number): string {
    if (!seconds || seconds <= 0) return '0:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

export const createYtDlpExtractor = () => new YtDlpExtractor();
export const ytDlpExtractor = new YtDlpExtractor();