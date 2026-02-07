import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // ULTRA-AGGRESSIVE cache prevention for ALL content
  const path = request.nextUrl.pathname;
  
  // Static Next.js assets can be cached (they have unique hashes)
  if (path.startsWith('/_next/static/')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    return response;
  }
  
  // Everything else - ULTRA-AGGRESSIVE no cache
  const noCacheHeaders = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0, stale-while-revalidate=0, stale-if-error=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store',
    'CDN-Cache-Control': 'no-store',
    'Vercel-CDN-Cache-Control': 'no-store',
    'Cloudflare-CDN-Cache-Control': 'no-store',
    'X-Accel-Expires': '0',
    'X-Timestamp': Date.now().toString(),
    'X-Cache-Buster': Math.random().toString(36).substring(7),
    'Last-Modified': new Date(0).toUTCString(),
    'ETag': `"no-cache-${Date.now()}"`,
  };

  // Apply all no-cache headers
  Object.entries(noCacheHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Additional security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

// Apply middleware to all routes except static files
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files with hashes)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
