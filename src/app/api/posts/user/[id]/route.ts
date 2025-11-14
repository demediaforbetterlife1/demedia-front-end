import { NextRequest, NextResponse } from "next/server";

/**
 * User Posts API - Proxies requests to backend
 * Frontend communicates with backend, backend handles database operations
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    
    // Get the authorization token from header or cookie
    let authHeader = request.headers.get('authorization');
    
    // If no auth header, try to get token from cookie
    if (!authHeader) {
      const cookies = request.cookies;
      const token = cookies.get('token')?.value;
      if (token) {
        authHeader = `Bearer ${token}`;
      }
    }
    
    console.log('Fetching user posts via backend for user:', userId);
    
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header or token' }, { status: 401 });
    }

    // Extract current user id from JWT for like status checking
    let currentUserId: string | null = null;
    try {
      const token = authHeader.replace('Bearer ', '');
      const part = token.split('.')[1];
      const decoded = JSON.parse(Buffer.from(part, 'base64').toString('utf-8'));
      currentUserId = (decoded.sub || decoded.userId || decoded.id)?.toString?.() || null;
    } catch (_) {}

    // Forward request to backend
    const backendUrl = process.env.BACKEND_URL || 'https://demedia-backend.fly.dev';
    const response = await fetch(`${backendUrl}/api/posts/user/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'user-id': currentUserId || '',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Fetched user posts via backend:', data.posts?.length || 0, 'posts for user:', userId);
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Error fetching user posts via backend:', error);
    return NextResponse.json({ error: 'Failed to fetch user posts' }, { status: 500 });
  }
}