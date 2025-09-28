/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
    domains: [
      'i.ytimg.com', 
      'yt3.ggpht.com', 
      'img.youtube.com', 
      'www.eporner.com',
      'raw.githubusercontent.com',
      'api.github.com',
      'github.com',
      'avatars.githubusercontent.com',
      // Common CloudStream provider domains
      'cdn.jsdelivr.net',
      'unpkg.com',
      'fastly.jsdelivr.net'
    ],
    formats: ['image/webp', 'image/avif'],
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/proxy/github/:path*',
        destination: 'https://api.github.com/:path*',
      },
      {
        source: '/proxy/raw/:owner/:repo/:branch/:path*',
        destination: 'https://raw.githubusercontent.com/:owner/:repo/:branch/:path*',
      },
    ]
  },
}

export default nextConfig
