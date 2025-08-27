/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: false,
    domains: ['i.ytimg.com', 'yt3.ggpht.com', 'img.youtube.com'],
    formats: ['image/webp', 'image/avif'],
  },
}

export default nextConfig
