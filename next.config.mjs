import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
  ],
  buildExcludes: [/middleware-manifest\.json$/],
  scope: '/',
  sw: 'sw.js',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  eslint: {
    ignoreDuringBuilds: true,
  },

  // output: "standalone",
  compress: true,
  poweredByHeader: false,

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

  // PWA Configuration
  experimental: {
    webVitalsAttribution: ['CLS', 'LCP']
  },
};

export default withPWA(nextConfig);
