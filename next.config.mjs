/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    domains: ['i.ytimg.com', 'yt3.ggpht.com', 'img.youtube.com', 'www.eporner.com'],
    formats: ['image/webp', 'image/avif'],
  },
}

export default nextConfig
