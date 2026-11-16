import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    // Allow local public/ assets; no external domains needed for MVP
    unoptimized: false,
  },
}

export default nextConfig
