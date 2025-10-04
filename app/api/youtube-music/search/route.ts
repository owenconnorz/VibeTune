// Server-only search for YouTube videos.
// Uses YouTube Data API v3: https://developers.google.com/youtube/v3/docs/search
// Returns normalized results ready for UI consumption.

import { NextRequest } from "next/server";
import { searchYouTube } from "@/lib/youtube";

// Revalidate cached responses every 60s in production
export const revalidate = 60;

type Json = Response;

function badRequest(msg: string, status = 400): Json {
  return Response.json({ error: msg }, { status });
}

// Super simple in-memory limiter (per Lambda instance).
// For production scale, swap with Upstash Redis, etc.
const WINDOW_MS = 60_000;
const MAX_REQ = 60;
const bucket = new Map<string, { count: number; windowStart: number }>();

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const rec = bucket.get(ip);
  if (!rec || now - rec.windowStart > WINDOW_MS) {
    bucket.set(ip, { count: 1, windowStart: now });
    return true;
  }
  if (rec.count >= MAX_REQ) return false;
  rec.count += 1;
  return true;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  const pageToken = url.searchParams.get("pageToken") ?? undefined;

  if (!q) return badRequest("Missing query ?q=");

  const ip =
    req.ip ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "anon";

  if (!rateLimit(ip)) return badRequest("Rate limit exceeded", 429);

  try {
    const data = await searchYouTube(q, { pageToken });
    // Cache hint for downstream and browsers
    return Response.json(data, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (err: any) {
    console.error("YT search failed:", err?.message || err);
    return Response.json(
      { error: "Search failed", details: err?.message || String(err) },
      { status: 502 },
    );
  }
}