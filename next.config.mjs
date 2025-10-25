// next.config.mjs

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
  
    eslint: {
      ignoreDuringBuilds: true,
    },
  
   // output: "standalone",
    compress: true,
    poweredByHeader: false,
  
    async rewrites() {
        const target = "https://demedia-backend.fly.dev";
        return [
          // API routes only
          {
            source: "/api/:path*",
            destination: `${target}/api/:path*`,
          },
          {
            source: "/socket.io/:path*",
            destination: `${target}/socket.io/:path*`,
          },
          // تأكد إن باقي الملفات (زي _next/static) ما تتأثرش
        ];
      }      
  };
  
  export default nextConfig;
  