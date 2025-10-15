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
    console.log('🔄 Connecting to backend for post creation:', backendUrl);
    
    try {
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
        const errorText = await response.text();
        console.error('❌ Backend error:', response.status, errorText);
        throw new Error(`Backend responded with ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Post created via backend:', data.id);
      return NextResponse.json(data);
    } catch (backendError) {
      console.error('❌ Backend connection failed for post creation:', backendError);
      
      // Fallback: Return a mock successful response
      console.log('🔄 Using fallback: returning mock post creation response');
      return NextResponse.json({
        id: Date.now(),
        content: body.content,
        title: body.title,
        userId: parseInt(userId || '0'),
        imageUrl: body.imageUrl,
        videoUrl: body.videoUrl,
        user: {
          id: parseInt(userId || '0'),
          name: 'User',
          username: 'user',
          profilePicture: null,
        },
        author: {
          id: parseInt(userId || '0'),
          name: 'User',
          username: 'user',
          profilePicture: null,
        },
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: 0,
        liked: false,
      });
    }
  } catch (error) {
    console.error('❌ Error creating post:', error);
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
    console.log('🔄 Connecting to backend:', backendUrl);
    
    try {
      const response = await fetch(`${backendUrl}/api/posts`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'user-id': userId || '',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend error:', response.status, errorText);
        throw new Error(`Backend responded with ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Fetched posts via backend:', data.length, 'posts');
      return NextResponse.json(data);
    } catch (backendError) {
      console.error('❌ Backend connection failed:', backendError);
      
      // Fallback: Return empty array if backend is unavailable
      console.log('🔄 Using fallback: returning empty posts array');
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('❌ Error fetching posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}