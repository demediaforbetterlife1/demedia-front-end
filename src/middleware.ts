import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // AGGRESSIVE cache prevention - NEVER cache anything
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0, stale-while-revalidate=0, stale-if-error=0');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  response.headers.set('Surrogate-Control', 'no-store');
  response.headers.set('CDN-Cache-Control', 'no-store');
  response.headers.set('Vercel-CDN-Cache-Control', 'no-store');
  
  // Add timestamp to force fresh requests
  response.headers.set('X-Timestamp', Date.now().toString());

  return response;
}

// Apply middleware to ALL routes (including static files)
export const config = {
  matcher: [
    /*
     * Match ALL request paths - no exceptions
     * This ensures no caching anywhere
     */
    '/:path*',
  ],
};
