import { NextRequest, NextResponse } from "next/server";

/**
 * Comments API - Proxies requests to backend
 * Handles comment creation and fetching for posts
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    
    // Get token from multiple sources
    let token = null;
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '');
    }
    if (!token) {
      token = request.cookies.get('token')?.value || null;
    }
    
    const userId = request.headers.get('user-id');
    
    console.log('💬 Fetching comments for post:', postId, 'hasToken:', !!token);

    if (!token) {
      console.warn('⚠️ No token found, returning empty comments');
      return NextResponse.json([]);
    }

    // Forward request to backend
    const backendUrl = process.env.BACKEND_URL || 'https://demedia-backend.fly.dev';
    console.log('🔄 Connecting to backend for comments:', backendUrl);
    
    try {
      const response = await fetch(`${backendUrl}/api/posts/${postId}/comments`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'user-id': userId || '',
          'Content-Type': 'application/json',
          'Cookie': `token=${token}`,
        },
      });

      console.log('📡 Backend response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend error:', response.status, errorText);
        // Return empty array instead of throwing
        return NextResponse.json([]);
      }

      const data = await response.json();
      console.log('✅ Fetched', data.length || 0, 'comments');
      return NextResponse.json(Array.isArray(data) ? data : []);
    } catch (backendError) {
      console.error('❌ Backend connection failed for comments:', backendError);
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('❌ Error fetching comments:', error);
    return NextResponse.json([]);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const authHeader = request.headers.get('authorization');
    const body = await request.json();
    
    console.log('Creating comment for post:', postId, 'content:', body.content);

    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    if (!body.content || body.content.trim() === '') {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    // Forward request to backend
    const backendUrl = process.env.BACKEND_URL || 'https://demedia-backend.fly.dev';
    console.log('🔄 Connecting to backend for comment creation:', backendUrl);
    
    try {
      const response = await fetch(`${backendUrl}/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      console.log('🔄 Backend response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend error:', response.status, errorText);
        throw new Error(`Backend responded with ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Comment created via backend:', data.id);
      return NextResponse.json(data);
    } catch (backendError) {
      console.error('❌ Backend connection failed for comment creation:', backendError);
      
      // Fallback: Return mock comment
      console.log('🔄 Using fallback: returning mock comment');
      return NextResponse.json({
        id: Date.now(),
        content: body.content,
        createdAt: new Date().toISOString(),
        user: {
          name: 'User',
          username: 'user',
          profilePicture: null,
        },
        likes: 0,
        isLiked: false,
      });
    }
  } catch (error) {
    console.error('❌ Error creating comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
