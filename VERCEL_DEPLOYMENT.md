# Vercel Deployment Guide

## Critical Environment Variables Required

**You MUST set these in your Vercel dashboard under Project Settings > Environment Variables:**

### Required Variables
- `YOUTUBE_API_KEY` - Your YouTube Data API v3 key (currently hardcoded, needs to be moved to env var)

### Optional OAuth Variables (if using authentication)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `DISCORD_CLIENT_ID` - Discord OAuth client ID
- `DISCORD_CLIENT_SECRET` - Discord OAuth client secret
- `REDDIT_CLIENT_ID` - Reddit OAuth client ID
- `REDDIT_CLIENT_SECRET` - Reddit OAuth client secret

## Why Your Code Isn't Appearing on Vercel

The main issues preventing deployment were:

1. **Build Error Ignoring** - `next.config.mjs` was ignoring TypeScript/ESLint errors that would cause deployment failures
2. **Deprecated Commands** - `next export` in package.json is deprecated in Next.js 13+
3. **Hardcoded API Keys** - YouTube API key needs to be in environment variables
4. **Missing Environment Variables** - OAuth credentials not set in Vercel

## Deployment Steps

1. **Set Environment Variables** in Vercel dashboard (most critical step)
2. **Remove hardcoded API key** from `.env.local` (it should only be in Vercel env vars)
3. **Redeploy** - Vercel will now properly build without ignoring errors
4. **Check build logs** in Vercel dashboard for any remaining issues

## Troubleshooting

If deployment still fails:
1. Check Vercel build logs for specific TypeScript/ESLint errors
2. Ensure `YOUTUBE_API_KEY` is set in Vercel environment variables
3. Run `npm run lint` locally to catch any remaining issues
4. Verify all imports and dependencies are correct
