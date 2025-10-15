import { NextRequest, NextResponse } from "next/server";

/**
 * Posts API - Proxies requests to backend
 * Frontend communicates with backend, backend handles database operations
 */

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const userId = request.headers.get('user-id');

    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Creating new post via backend:', body);

    // Forward request to backend
    const backendUrl = process.env.BACKEND_URL || 'https://demedia-backend.fly.dev';
    const response = await fetch(`${backendUrl}/api/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'user-id': userId || '',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Post created via backend:', data.id);
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Error creating post via backend:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const userId = request.headers.get('user-id');
    
    console.log('Fetching posts via backend, userId:', userId);

    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    // Forward request to backend
    const backendUrl = process.env.BACKEND_URL || 'https://demedia-backend.fly.dev';
    const response = await fetch(`${backendUrl}/api/posts`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'user-id': userId || '',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Fetched posts via backend:', data.length, 'posts');
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Error fetching posts via backend:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}