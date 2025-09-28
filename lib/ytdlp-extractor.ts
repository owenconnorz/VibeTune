import { YtDlpWrap } from "yt-dlp-wrap";

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
  private readonly YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "YOUR_API_KEY";
  private readonly YOUTUBE_BASE_URL = "https://www.googleapis.com/youtube/v3";
  private readonly ytDlp: YtDlpWrap;

  constructor() {
    this.ytDlp = new YtDlpWrap();
  }

  async getTrending(maxResults = 25): Promise<YtDlpSong[]> {
    const response = await fetch(
      `${this.YOUTUBE_BASE_URL}/videos?part=snippet,contentDetails&chart=mostPopular&videoCategoryId=10&regionCode=US&maxResults=${maxResults}&key=${this.YOUTUBE_API_KEY}`
    );

    if (!response.ok) throw new Error(`YouTube API error: ${response.status}`);
    const data = await response.json();

    const songs: YtDlpSong[] = [];
    for (const item of data.items.slice(0, Math.min(maxResults, 10))) {
      const videoInfo = await this.getVideoInfo(item.id);
      if (videoInfo) songs.push(this.convertToSong(videoInfo, item));
    }
    return songs;
  }

  async search(query: string, maxResults = 15): Promise<YtDlpSong[]> {
    const response = await fetch(
      `${this.YOUTUBE_BASE_URL}/search?part=snippet&q=${encodeURIComponent(query + " music")}&type=video&videoCategoryId=10&maxResults=${maxResults}&key=${this.YOUTUBE_API_KEY}`
    );

    if (!response.ok) throw new Error(`YouTube API error: ${response.status}`);
    const data = await response.json();

    const songs: YtDlpSong[] = [];
    for (const item of data.items.slice(0, Math.min(maxResults, 8))) {
      const videoInfo = await this.getVideoInfo(item.id.videoId);
      if (videoInfo) songs.push(this.convertToSong(videoInfo, item));
    }
    return songs;
  }

  async getVideoInfo(videoId: string): Promise<YtDlpVideoInfo | null> {
    try {
      const jsonStr = await this.ytDlp.execPromise([
        "--dump-json",
        "--no-playlist",
        "--format",
        "bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio",
        `https://www.youtube.com/watch?v=${videoId}`,
      ]);

      const info: YtDlpVideoInfo = JSON.parse(jsonStr);
      return info;
    } catch (err) {
      console.error("YtDlpExtractor: Failed to get video info", err);
      return null;
    }
  }

  async getAudioUrl(videoId: string): Promise<string | null> {
    try {
      const urlStr = await this.ytDlp.execPromise([
        "--get-url",
        "--no-playlist",
        "--format",
        "bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio",
        `https://www.youtube.com/watch?v=${videoId}`,
      ]);
      return urlStr.split("\n")[0];
    } catch (err) {
      console.error("YtDlpExtractor: Failed to get audio URL", err);
      return null;
    }
  }

  private convertToSong(videoInfo: YtDlpVideoInfo, youtubeItem?: any): YtDlpSong {
    const audioFormats = videoInfo.formats?.filter(f => f.acodec && f.acodec !== "none" && f.url) || [];
    const bestAudio = audioFormats.find(f => f.ext === "m4a") || audioFormats.find(f => f.ext === "webm") || audioFormats[0];

    return {
      id: videoInfo.id,
      title: videoInfo.title,
      artist: videoInfo.uploader || "Unknown Artist",
      thumbnail: videoInfo.thumbnail || "",
      duration: this.formatDuration(videoInfo.duration || 0),
      url: videoInfo.webpage_url,
      audioUrl: bestAudio?.url || "",
      formats: audioFormats,
    };
  }

  private formatDuration(seconds: number): string {
    if (!seconds || seconds <= 0) return "0:00";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return hours > 0
      ? `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
      : `${minutes}:${secs.toString().padStart(2, "0")}`;
  }
}

export const createYtDlpExtractor = () => new YtDlpExtractor();
export const ytDlpExtractor = new YtDlpExtractor();