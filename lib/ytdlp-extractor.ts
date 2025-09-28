import { ytDlp } from "yt-dlp-exec";

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

export class YtDlpExtractor {
  private readonly YOUTUBE_API_KEY =
    process.env.YOUTUBE_API_KEY || "AIzaSyBIQVGnXO2T7smsxf6q_MWxMD1sQzek1Nc";
  private readonly YOUTUBE_BASE_URL = "https://www.googleapis.com/youtube/v3";

  // --- Get trending music from YouTube ---
  async getTrending(maxResults = 25): Promise<YtDlpSong[]> {
    const response = await fetch(
      `${this.YOUTUBE_BASE_URL}/videos?part=snippet,contentDetails&chart=mostPopular&videoCategoryId=10&regionCode=US&maxResults=${maxResults}&key=${this.YOUTUBE_API_KEY}`
    );
    if (!response.ok) throw new Error(`YouTube API error: ${response.status}`);
    const data = await response.json();
    const songs: YtDlpSong[] = [];
    for (const item of data.items.slice(0, Math.min(maxResults, 10))) {
      const videoInfo = await this.getVideoInfo(item.id);
      if (videoInfo) songs.push(this.convertToSong(videoInfo));
    }
    return songs;
  }

  // --- Search YouTube ---
  async search(query: string, maxResults = 15): Promise<YtDlpSong[]> {
    const response = await fetch(
      `${this.YOUTUBE_BASE_URL}/search?part=snippet&q=${encodeURIComponent(
        query + " music"
      )}&type=video&videoCategoryId=10&maxResults=${maxResults}&key=${this.YOUTUBE_API_KEY}`
    );
    if (!response.ok) throw new Error(`YouTube API error: ${response.status}`);
    const data = await response.json();
    const songs: YtDlpSong[] = [];
    for (const item of data.items.slice(0, Math.min(maxResults, 8))) {
      const videoInfo = await this.getVideoInfo(item.id.videoId);
      if (videoInfo) songs.push(this.convertToSong(videoInfo));
    }
    return songs;
  }

  // --- Get video info using yt-dlp-exec ---
  async getVideoInfo(videoId: string): Promise<YtDlpVideoInfo | null> {
    try {
      const info = await ytDlp(`https://www.youtube.com/watch?v=${videoId}`, {
        dumpJson: true,
        noPlaylist: true,
        format: "bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio",
      });
      return {
        id: info.id,
        title: info.title,
        uploader: info.uploader || "Unknown Artist",
        thumbnail: info.thumbnail || "",
        duration: info.duration || 0,
        webpage_url: info.webpage_url,
        formats: info.formats || [],
      };
    } catch (error) {
      console.error("yt-dlp error:", error);
      return null;
    }
  }

  // --- Get direct audio URL ---
  async getAudioUrl(videoId: string): Promise<string | null> {
    try {
      const info = await ytDlp(`https://www.youtube.com/watch?v=${videoId}`, {
        getUrl: true,
        noPlaylist: true,
        format: "bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio",
      });
      if (typeof info === "string") return info.split("\n")[0];
      return null;
    } catch (error) {
      console.error("yt-dlp getAudioUrl error:", error);
      return null;
    }
  }

  // --- Convert video info to song ---
  private convertToSong(videoInfo: YtDlpVideoInfo): YtDlpSong {
    const audioFormats = videoInfo.formats?.filter(
      (f) => f.acodec && f.acodec !== "none" && f.url
    );
    const bestAudio =
      audioFormats.find((f) => f.ext === "m4a") ||
      audioFormats.find((f) => f.ext === "webm") ||
      audioFormats?.[0];
    return {
      id: videoInfo.id,
      title: videoInfo.title,
      artist: videoInfo.uploader || "Unknown Artist",
      thumbnail: videoInfo.thumbnail || "",
      duration: this.formatDuration(videoInfo.duration),
      url: videoInfo.webpage_url,
      audioUrl: bestAudio?.url || "",
      formats: audioFormats,
    };
  }

  // --- Format seconds to mm:ss or hh:mm:ss ---
  private formatDuration(seconds: number): string {
    if (!seconds || seconds <= 0) return "0:00";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0)
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }
}

export const createYtDlpExtractor = () => new YtDlpExtractor();
export const ytDlpExtractor = new YtDlpExtractor();