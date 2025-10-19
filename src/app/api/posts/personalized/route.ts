import { NextRequest, NextResponse } from "next/server";

/**
 * Personalized Posts API - Proxies requests to backend
 * Frontend communicates with backend, backend handles database operations
 */

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const userId = request.headers.get('user-id');
    
    if (!authHeader || !userId) {
      return NextResponse.json({ error: 'No authorization header or user ID' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Fetching personalized posts via backend, userId:', userId, 'interests:', body.interests);

    // Forward request to backend
    const backendUrl = process.env.BACKEND_URL || 'https://demedia-backend.fly.dev';
    console.log('🔄 Connecting to backend for personalized posts:', backendUrl);
    
    try {
      const response = await fetch(`${backendUrl}/api/posts/personalized`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
          'user-id': userId,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend error:', response.status, errorText);
        throw new Error(`Backend responded with ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Fetched personalized posts via backend:', data.length, 'posts');
      return NextResponse.json(data);
    } catch (backendError) {
      console.error('❌ Backend connection failed for personalized posts:', backendError);
      
      // Fallback: Return empty array if backend is unavailable
      console.log('🔄 Using fallback: returning empty personalized posts array');
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('❌ Error fetching personalized posts:', error);
    return NextResponse.json({ error: 'Failed to fetch personalized posts' }, { status: 500 });
  }
}