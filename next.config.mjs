// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    eslint: {
        // Allow production builds to succeed even if ESLint finds errors
        ignoreDuringBuilds: true,
    },
    // Enable standalone build output
    output: "standalone",
    compress: true,
    poweredByHeader: false,
    async rewrites() {
        // Always use the Fly.io backend URL
        const target = "https://demedia-back-end-b8ouzq.fly.dev";
        return [
            { source: "/api/:path*", destination: `${target}/api/:path*` },
            { source: "/socket.io/:path*", destination: `${target}/socket.io/:path*` },
        ];
    },
};

export default nextConfig;
