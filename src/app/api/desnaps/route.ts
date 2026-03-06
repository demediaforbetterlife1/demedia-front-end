import { NextRequest, NextResponse } from "next/server";

// Route segment config for Next.js 13+
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * DeSnaps API - Proxies requests to backend
 * Handles story creation and management
 */

export async function POST(request: NextRequest) {
  try {
    // Try to get token from Authorization header first, then fall back to cookie
    let token = null;
    let authHeader = request.headers.get('authorization');
    
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '');
    }
    
    // If no token in header, try cookie
    if (!token) {
      token = request.cookies.get('token')?.value || null;
    }
    
    if (!token) {
      console.error('? No authorization token found in header or cookie');
      return NextResponse.json({ 
        error: 'Authorization header is required. Please include a valid Bearer token in the Authorization header.' 
      }, { status: 401 });
    }
    
    const body = await request.json();

    console.log('Creating new DeSnap via backend:', body);

    // Forward request to backend
    const backendUrl = process.env.BACKEND_URL || 'https://demedia-backend-production.up.railway.app';
    console.log('?? Connecting to backend for DeSnap creation:', backendUrl);
    
    try {
      const response = await fetch(`${backendUrl}/api/desnaps`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Cookie': `token=${token}`, // Forward cookie for backend auth
        },
        body: JSON.stringify(body),
      });

      console.log('?? Backend response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('? Backend error:', response.status, errorText);
        return NextResponse.json({ 
          error: errorText || `Backend responded with ${response.status}` 
        }, { status: response.status });
      }

      const data = await response.json();
      console.log('? DeSnap created via backend:', data.id);
      return NextResponse.json(data);
    } catch (backendError) {
      console.error('? Backend connection failed for DeSnap creation:', backendError);
      return NextResponse.json({ 
        error: `Backend connection failed: ${backendError instanceof Error ? backendError.message : 'Unknown error'}` 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('? Error creating DeSnap:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to create DeSnap' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'all'; // 'all', 'following', 'public'
    const profileUserId = searchParams.get('userId'); // For profile view
    
    // Try to get token from cookie first, then fall back to Authorization header
    let token = request.cookies.get('token')?.value;
    let authHeader = request.headers.get('authorization');
    const userId = request.headers.get('user-id');
    
    if (!token && authHeader?.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '');
    }
    
    if (!token) {
      return NextResponse.json({ error: 'No authorization token' }, { status: 401 });
    }
    
    console.log('Fetching DeSnaps via backend - view:', view, 'profileUserId:', profileUserId);

    // Forward request to backend with query params
    const backendUrl = process.env.BACKEND_URL || 'https://demedia-backend-production.up.railway.app';
    const backendParams = new URLSearchParams();
    if (view) backendParams.set('view', view);
    if (profileUserId) backendParams.set('userId', profileUserId);
    if (userId) backendParams.set('viewerId', userId);
    
    const finalUrl = `${backendUrl}/api/desnaps?${backendParams.toString()}`;
    console.log('📤 Connecting to backend:', finalUrl);
    
    try {
      const response = await fetch(finalUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cookie': `token=${token}`, // Forward cookie for backend auth
          'Content-Type': 'application/json',
          'user-id': userId || '',
        },
      });

      console.log('📡 Backend response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend error:', response.status, errorText);
        throw new Error(`Backend responded with ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Fetched DeSnaps via backend:', data.length, 'DeSnaps');
      return NextResponse.json(data);
    } catch (backendError) {
      console.error('🚨 Backend connection failed:', backendError);
      
      // Return empty array if backend is unavailable
      console.log('🔧 Backend unavailable: returning empty DeSnaps array');
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('❌ Error fetching DeSnaps:', error);
    return NextResponse.json({ error: 'Failed to fetch DeSnaps' }, { status: 500 });
  }
}
