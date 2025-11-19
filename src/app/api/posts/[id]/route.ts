import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // ✅ لازم await لأن params Promise

    if (!id) {
      return NextResponse.json({ error: "Missing post ID" }, { status: 400 });
    }

    // Extract token from cookies or Authorization header
    const token = request.cookies.get('token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const authHeader = `Bearer ${token}`;
    const userId = request.headers.get('user-id');

    const backendUrl = "https://demedia-backend.fly.dev";
    const res = await fetch(`${backendUrl}/api/posts/${id}`, {
      cache: "no-store",
      headers: {
        'Authorization': authHeader,
        'user-id': userId || '',
        'Content-Type': 'application/json',
      },
    });

    const text = await res.text();

    if (!res.ok) {
      console.error('❌ Backend post fetch failed:', res.status, text);
      let payload: any = text;
      try {
        payload = text ? JSON.parse(text) : { error: res.statusText };
      } catch {
        payload = { error: text || res.statusText || 'Failed to fetch post' };
      }
      
      // Provide more user-friendly error messages
      if (res.status === 404) {
        payload = { 
          error: 'This post could not be found. It may have been deleted or is no longer available.',
          code: 'POST_NOT_FOUND'
        };
      } else if (res.status >= 500) {
        payload = { 
          error: 'Unable to load post right now. Please try again in a moment.',
          code: 'SERVER_ERROR'
        };
      }
      
      return NextResponse.json(payload, { status: res.status });
    }

    try {
      const data = text ? JSON.parse(text) : null;
      return NextResponse.json(data, { status: 200 });
    } catch (parseError) {
      console.error('❌ Failed to parse backend post response:', parseError);
      return NextResponse.json(
        { error: 'Invalid response from backend', details: text },
        { status: 502 }
      );
    }
  } catch (error: any) {
    console.error("Error fetching single post:", error?.message || error);
    return NextResponse.json(
      { error: "Failed to fetch post. Please try again." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let postId: string = '';
  try {
    const resolvedParams = await params;
    postId = resolvedParams.id;
    
    // Validate postId
    if (!postId || isNaN(Number(postId))) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }
    
    const body = await request.json();
    
    // Validate request body
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    
    // Extract token from cookies or Authorization header
    const token = request.cookies.get('token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const authHeader = `Bearer ${token}`;
    const userId = request.headers.get('user-id');

    console.log('Post update request:', { postId, body, userId });

    // Try to connect to the actual backend first
    try {
      console.log('🔄 Updating post via backend:', postId, 'userId:', userId);

      const backendResponse = await fetch(`https://demedia-backend.fly.dev/api/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Authorization': authHeader,
          'user-id': userId || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000)
      });

      console.log('🔄 Backend response status:', backendResponse.status);

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        return NextResponse.json(data);
      }

      const errorText = await backendResponse.text();
      return NextResponse.json({ error: errorText || 'Failed to update post' }, { status: backendResponse.status });
    } catch (backendError) {
      console.error('❌ Backend connection failed for post update:', backendError);
      return NextResponse.json({ error: 'Backend unavailable' }, { status: 503 });
    }
    // no fallback in production
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Failed to update post',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    
    // Extract token from cookies or Authorization header
    const token = request.cookies.get('token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const authHeader = `Bearer ${token}`;
    const userId = request.headers.get('user-id');

    console.log('Post delete request:', { postId, userId });

    // Try to connect to the actual backend first
    try {

      const backendResponse = await fetch(`https://demedia-backend.fly.dev/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': authHeader,
          'user-id': userId || '',
          'Content-Type': 'application/json',
        },
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        return NextResponse.json(data);
      }
      const errorText = await backendResponse.text();
      return NextResponse.json({ error: errorText || 'Failed to delete post' }, { status: backendResponse.status });
    } catch (backendError) {
      console.log('Backend not available for delete');
      return NextResponse.json({ error: 'Backend unavailable' }, { status: 503 });
    }
    // no fallback
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
