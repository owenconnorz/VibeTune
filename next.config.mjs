/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: false,
    domains: ['i.ytimg.com', 'yt3.ggpht.com', 'img.youtube.com'],
    formats: ['image/webp', 'image/avif'],
  },
  experimental: {
    runtime: 'nodejs',
  },
}

export default nextConfig
