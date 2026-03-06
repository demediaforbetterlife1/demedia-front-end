import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  // Use Vercel's Git commit SHA or fallback to timestamp
  const buildId = process.env.VERCEL_GIT_COMMIT_SHA || 
                  process.env.BUILD_ID || 
                  process.env.NEXT_PUBLIC_BUILD_ID ||
                  Date.now().toString();

  return NextResponse.json({
    buildId: buildId,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.VERCEL_ENV || 'development'
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    }
  });
}
