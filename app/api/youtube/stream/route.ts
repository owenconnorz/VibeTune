import { type NextRequest, NextResponse } from "next/server"
import { createAdvancedYouTubeAPI, type YouTubeAPISettings } from "@/lib/youtube-api-advanced"
import { createStreamSelector } from "@/lib/stream-selector"
import { networkStrategyManager } from "@/lib/network-strategy"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get("videoId")
    const quality = searchParams.get("quality") || "medium"
    const format = searchParams.get("format") || "audio"

    console.log("[v0] Stream API called for video:", videoId, "quality:", quality, "format:", format)

    if (!videoId) {
      return NextResponse.json({ error: "videoId parameter is required" }, { status: 400 })
    }

    const apiKey = process.env.YOUTUBE_API_KEY
    if (!apiKey) {
      throw new Error("YouTube API key not configured")
    }

    const networkConditions = networkStrategyManager.getCurrentNetworkConditions()
    console.log("[v0] Network conditions for streaming:", networkConditions)

    const settings: YouTubeAPISettings = {
      highQuality: quality === "high",
      preferVideos: format === "video",
      showVideos: format === "video",
      highQualityAudio: quality === "high" && networkConditions.type === "wifi",
      preferOpus: true,
      adaptiveAudio: true,
    }

    const youtubeAPI = createAdvancedYouTubeAPI(apiKey, settings)
    const streamSelector = createStreamSelector(settings)

    const streamData = await youtubeAPI.getStreamData(videoId)

    if (!streamData.audioFormats.length && !streamData.videoFormats.length) {
      throw new Error("No stream formats available")
    }

    const selectedStreams = streamSelector.selectOptimalStreams(streamData.audioFormats, streamData.videoFormats, {
      targetVideoQuality: quality === "high" ? 720 : quality === "medium" ? 480 : 144,
      networkType: networkConditions.type,
      settings,
    })

    console.log("[v0] Stream selection completed:", {
      hasAudio: !!selectedStreams.audio,
      hasVideo: !!selectedStreams.video,
      merged: selectedStreams.merged,
      audioQuality: selectedStreams.quality.audio,
      videoQuality: selectedStreams.quality.video,
    })

    const response = {
      videoId,
      title: streamData.title,
      duration: streamData.duration,
      thumbnail: streamData.thumbnail,
      author: streamData.author,
      viewCount: streamData.viewCount,
      streams: {
        audio: selectedStreams.audio
          ? {
              url: selectedStreams.audio.url,
              mimeType: selectedStreams.audio.mimeType,
              bitrate: selectedStreams.audio.bitrate,
              quality: selectedStreams.quality.audio,
            }
          : null,
        video: selectedStreams.video
          ? {
              url: selectedStreams.video.url,
              mimeType: selectedStreams.video.mimeType,
              bitrate: selectedStreams.video.bitrate,
              width: selectedStreams.video.width,
              height: selectedStreams.video.height,
            }
          : null,
        merged: selectedStreams.merged,
      },
      networkType: networkConditions.type,
      source: "youtube_advanced",
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("[v0] Stream API error:", error)
    return NextResponse.json(
      {
        error: error.message,
        videoId: new URL(request.url).searchParams.get("videoId"),
        source: "youtube_advanced",
      },
      { status: 500 },
    )
  }
}
