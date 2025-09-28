import type { NextApiRequest, NextApiResponse } from "next";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY!;
const BASE_URL = "https://www.googleapis.com/youtube/v3";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const maxResults = Number(req.query.maxResults || 25);
    const response = await fetch(
      `${BASE_URL}/videos?part=snippet,contentDetails&chart=mostPopular&videoCategoryId=10&regionCode=US&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`
    );
    if (!response.ok) return res.status(response.status).json({ error: "YouTube API error" });

    const data = await response.json();

    const songs = data.items.map((item: any) => ({
      id: item.id,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails?.high?.url || "",
      duration: item.contentDetails?.duration || "PT0S",
      url: `https://www.youtube.com/watch?v=${item.id}`,
      audioUrl: "" 
    }));

    res.status(200).json({ songs });
  } catch (err) {
    console.error("Trending API failed:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}