/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // output: "standalone",
  compress: true,
  poweredByHeader: false,

  // Add empty turbopack config to silence the warning
  turbopack: {},

  // Generate unique build ID for cache busting
  generateBuildId: async () => {
    // Use Vercel's Git commit SHA or timestamp
    return process.env.VERCEL_GIT_COMMIT_SHA || Date.now().toString();
  },

  // Environment variables - ensures NEXT_PUBLIC_API_URL is available
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://demedia-backend-production.up.railway.app',
    NEXT_PUBLIC_BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA || Date.now().toString(),
  },

  // Add cache control headers
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
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
        // No cache for API routes
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      {
        // Long cache for static assets
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache for images
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "demedia-backend.fly.dev",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "*.railway.app",
        pathname: "/uploads/**",
      },
    ],
  },

  async rewrites() {
    const target = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || "https://demedia-backend-production.up.railway.app";
    return [
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

  experimental: {
    webVitalsAttribution: ['CLS', 'LCP']
  },
};

// Only apply PWA in production builds with webpack
let config = nextConfig;

if (process.env.NODE_ENV === 'production' && !process.env.TURBOPACK) {
  try {
    const withPWAInit = require('next-pwa');
    const withPWA = withPWAInit({
      dest: 'public',
      register: true,
      skipWaiting: true,
      disable: false,
      runtimeCaching: [
        {
          urlPattern: /^https?.*/,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'offlineCache',
            expiration: {
              maxEntries: 200,
              maxAgeSeconds: 24 * 60 * 60,
            },
          },
        },
      ],
      buildExcludes: [/middleware-manifest\.json$/],
      scope: '/',
      sw: 'sw.js',
    });
    config = withPWA(nextConfig);
  } catch (e) {
    console.log('PWA plugin not available, skipping...');
  }
}

export default config;
