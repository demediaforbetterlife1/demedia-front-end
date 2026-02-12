/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  eslint: {
    ignoreDuringBuilds: true,
  },

  // Increase body size limit for video uploads
  experimental: {
    serverActions: {
      bodySizeLimit: '200mb',
    },
  },

  // output: "standalone",
  compress: true,
  poweredByHeader: false,

  // Generate unique build ID to bust cache on every deployment
  generateBuildId: async () => {
    return `build-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "demedia-backend.fly.dev",
        pathname: "/uploads/**",
      },
    ],
    unoptimized: false,
  },

  // BALANCED cache strategy - strict for dynamic content, permissive for static
  // This ensures authentication works while still preventing stale content
  async headers() {
    return [
      {
        // HTML pages - no cache for dynamic content
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        // API routes - CRITICAL: Minimal cache headers for auth stability
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store',
          },
        ],
      },
      {
        // Next.js static files - cache with unique hashes (safe to cache)
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Next.js data files - no cache (dynamic data)
        source: '/_next/data/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store',
          },
        ],
      },
      {
        // Static images - short cache (user content changes)
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate',
          },
        ],
      },
      {
        // Static assets - short cache
        source: '/assets/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate',
          },
        ],
      },
      {
        // User uploads - no cache (dynamic content)
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store',
          },
        ],
      },
      {
        // Service Worker - no caching
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        // Manifest - short cache
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, must-revalidate',
          },
        ],
      },
      {
        // Version file - no cache (update detection)
        source: '/version.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store',
          },
        ],
      },
    ];
  },

  async rewrites() {
  const target = process.env.BACKEND_URL || "https://demedia-backend.fly.dev";
  return [
    // ✅ Proxy ALL API calls to backend (fixes CORS + wrong base URL + 408)
    {
      source: "/api/:path*",
      destination: `${target}/api/:path*`,
    },

    {
      source: "/socket.io/:path*",
      destination: `${target}/socket.io/:path*`,
    },
    {
      source: "/uploads/:path*",
      destination: `${target}/uploads/:path*`,
    },
  ];
},
};

export default nextConfig;
