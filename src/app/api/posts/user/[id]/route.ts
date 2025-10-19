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
    const authHeader = request.headers.get('authorization');
    
    console.log('Fetching user posts via backend for user:', userId);
    
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    // Forward request to backend
    const backendUrl = process.env.BACKEND_URL || 'https://demedia-backend.fly.dev';
    const response = await fetch(`${backendUrl}/api/posts/user/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
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