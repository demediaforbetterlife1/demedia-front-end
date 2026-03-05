/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  eslint: {
    ignoreDuringBuilds: true,
  },

  // output: "standalone",
  compress: true,
  poweredByHeader: false,

  // Add empty turbopack config to silence the warning
  turbopack: {},

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
    const target = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || "https://demedia-backend.fly.dev";
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
