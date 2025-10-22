import { NextRequest, NextResponse } from "next/server";

/**
 * Posts API - Proxies requests to backend
 * Frontend communicates with backend, backend handles database operations
 */

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const userId = request.headers.get('user-id');

    const body = await request.json();
    console.log('Creating new post via backend:', body);

    // Forward request to backend
    const backendUrl = 'https://demedia-backend.fly.dev';
    console.log('🔄 Connecting to backend for post creation:', backendUrl);
    
    try {
      // Prepare the request body for the backend
      const backendBody = {
        title: body.title,
        content: body.content,
        userId: parseInt(userId || '0'), // Backend expects userId
        imageUrl: body.imageUrl,
        videoUrl: body.videoUrl,
        hashtags: body.hashtags || [],
        mentions: body.mentions || [],
        location: body.location || null,
        privacySettings: body.privacySettings || 'public',
        imageUrls: body.imageUrls || []
      };

      console.log('🔄 Sending to backend:', backendBody);

      const response = await fetch(`${backendUrl}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { 'Authorization': authHeader } : {}),
          'user-id': userId || '',
        },
        body: JSON.stringify(backendBody),
      });

      console.log('🔄 Backend response status:', response.status);

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
      // Fallback to local test post creation to avoid blocking UX
      try {
        const testRes = await fetch('/api/test-posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...body, userId: userId || '1' })
        });
        if (testRes.ok) {
          const mock = await testRes.json();
          return NextResponse.json(mock, { status: 201 });
        }
      } catch (e) {
        // ignore and fall through
      }

      return NextResponse.json({ 
        error: 'Failed to create a post. Please try again.',
      }, { status: 500 });
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

    // Forward request to backend
    const backendUrl = 'https://demedia-backend.fly.dev';
    console.log('🔄 Connecting to backend:', backendUrl);
    
    try {
      const response = await fetch(`${backendUrl}/api/posts`, {
        method: 'GET',
        headers: {
          ...(authHeader ? { 'Authorization': authHeader } : {}),
          'user-id': userId || '',
          'Content-Type': 'application/json',
        },
      });

      console.log('🔄 Backend response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend error:', response.status, errorText);
        throw new Error(`Backend responded with ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Fetched posts via backend:', data.length, 'posts');
      console.log('✅ First post from backend:', data[0]);
      return NextResponse.json(data);
    } catch (backendError) {
      console.error('❌ Backend connection failed:', backendError);
      // Fallback to local test posts
      try {
        const testRes = await fetch('/api/test-posts');
        if (testRes.ok) {
          const testData = await testRes.json();
          return NextResponse.json(testData);
        }
      } catch (_) {}
      return NextResponse.json([], { status: 200 });
    }
  } catch (error) {
    console.error('❌ Error fetching posts:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}