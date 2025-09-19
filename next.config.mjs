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
        const isProd = process.env.NODE_ENV === "production";
        const backendUrl = process.env.BACKEND_URL;

        // Single-domain model: in production, if BACKEND_URL is not set,
        // we return no rewrites so the platform ingress must route /api and /socket.io.
        if (isProd && !backendUrl) return [];

        // Otherwise, proxy via rewrites (dev or prod with BACKEND_URL set)
        const target = backendUrl || "http://localhost:5000";
        return [
            { source: "/api/:path*", destination: `${target}/api/:path*` },
            { source: "/socket.io/:path*", destination: `${target}/socket.io/:path*` },
        ];
    },
};

export default nextConfig;
