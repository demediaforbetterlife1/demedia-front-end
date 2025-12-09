import { NextRequest, NextResponse } from "next/server";

/**
 * User Search API - Proxies requests to backend
 * Searches users by name or username for collaboration features
 */

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const userId = request.headers.get('user-id');
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';

    console.log('Searching users via backend, query:', query);

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    // Forward request to backend
    const backendUrl = process.env.BACKEND_URL || 'https://demedia-backend.fly.dev';
    console.log('🔄 Connecting to backend for user search:', backendUrl);
    
    try {
      const headers: Record<string, string> = {};
      if (authHeader) headers['Authorization'] = authHeader;
      if (userId) headers['user-id'] = userId;

      const response = await fetch(`${backendUrl}/api/user/search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend error:', response.status, errorText);
        throw new Error(`Backend responded with ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ User search results:', data.length, 'users found');
      return NextResponse.json(data);
    } catch (backendError) {
      console.error('❌ Backend connection failed for user search:', backendError);
      
      // Fallback: Return empty array
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('❌ Error searching users:', error);
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 });
  }
}
