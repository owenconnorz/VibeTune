# Netlify Deployment Guide

## Quick Setup

1. **Connect Repository**: Link your GitHub repository to Netlify
2. **Build Settings**: 
   - Build command: `npm run build`
   - Publish directory: `.next`
3. **Environment Variables**: Add your `YOUTUBE_API_KEY` in Netlify dashboard
4. **Deploy**: Netlify will automatically deploy on every push to main branch

## Configuration Files

- `netlify.toml`: Contains build settings, redirects, and headers
- `package.json`: Updated with Netlify-specific build scripts

## Features Enabled

- ✅ Next.js API routes support
- ✅ Automatic HTTPS
- ✅ CDN caching for static assets
- ✅ API response caching (30 minutes)
- ✅ CORS headers for API endpoints

## Performance Optimizations

- Static assets cached for 1 year
- API responses cached for 30 minutes
- Optimized image loading
- Reduced YouTube API calls with improved caching
