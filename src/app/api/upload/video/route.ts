import { NextRequest, NextResponse } from "next/server";

export const runtime = 'nodejs';
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

/**
 * API Route: /api/upload/video
 * 
 * DEPRECATED: This route is no longer used for video uploads.
 * Videos are now uploaded directly to Cloudinary from the frontend using:
 * - Cloud: dgdpnbkru
 * - Preset: desnaps_reels
 * - Endpoint: https://api.cloudinary.com/v1_1/dgdpnbkru/video/upload
 * 
 * This endpoint is kept for backward compatibility and health checks.
 * New uploads flow directly through Cloudinary → Database via /api/desnaps
 */

export async function POST(request: NextRequest) {
  try {
    // This endpoint is deprecated
    // Videos now go: Frontend → Cloudinary (direct upload) → /api/desnaps (metadata)
    return NextResponse.json({ 
      error: 'This endpoint is deprecated',
      message: 'Videos are now uploaded directly to Cloudinary. Use the CreateDeSnapModal component which handles Cloudinary uploads.',
      details: 'Upload endpoint: https://api.cloudinary.com/v1_1/dgdpnbkru/video/upload'
    }, { status: 410 });

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
