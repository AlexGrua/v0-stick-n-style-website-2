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
  },
  experimental: {
    // Allow dev requests from cloudflared and localhost origins if needed
    allowedOrigins: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      ".trycloudflare.com",
    ],
  },
}

export default nextConfig