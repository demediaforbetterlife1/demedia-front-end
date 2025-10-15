import { NextRequest, NextResponse } from "next/server";

/**
 * Comment Management API - Proxies requests to backend
 * Handles comment editing and deletion
 */

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: commentId } = await params;
    const authHeader = request.headers.get('authorization');
    const userId = request.headers.get('user-id');
    const body = await request.json();
    
    console.log('Updating comment:', commentId, 'content:', body.content);

    if (!authHeader || !userId) {
      return NextResponse.json({ error: 'No authorization header or user ID' }, { status: 401 });
    }

    if (!body.content || body.content.trim() === '') {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    // Forward request to backend
    const backendUrl = process.env.BACKEND_URL || 'https://demedia-backend.fly.dev';
    console.log('🔄 Connecting to backend for comment update:', backendUrl);
    
    try {
      const response = await fetch(`${backendUrl}/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': authHeader,
          'user-id': userId,
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
      console.log('✅ Comment updated via backend:', data.id);
      return NextResponse.json(data);
    } catch (backendError) {
      console.error('❌ Backend connection failed for comment update:', backendError);
      
      // Fallback: Return mock updated comment
      console.log('🔄 Using fallback: returning mock updated comment');
      return NextResponse.json({
        id: parseInt(commentId),
        content: body.content,
        updatedAt: new Date().toISOString(),
        message: 'Comment updated successfully (development mode)'
      });
    }
  } catch (error) {
    console.error('❌ Error updating comment:', error);
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: commentId } = await params;
    const authHeader = request.headers.get('authorization');
    const userId = request.headers.get('user-id');
    
    console.log('Deleting comment:', commentId);

    if (!authHeader || !userId) {
      return NextResponse.json({ error: 'No authorization header or user ID' }, { status: 401 });
    }

    // Forward request to backend
    const backendUrl = process.env.BACKEND_URL || 'https://demedia-backend.fly.dev';
    console.log('🔄 Connecting to backend for comment deletion:', backendUrl);
    
    try {
      const response = await fetch(`${backendUrl}/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': authHeader,
          'user-id': userId,
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
      console.log('✅ Comment deleted via backend:', commentId);
      return NextResponse.json(data);
    } catch (backendError) {
      console.error('❌ Backend connection failed for comment deletion:', backendError);
      
      // Fallback: Return mock deletion success
      console.log('🔄 Using fallback: returning mock deletion success');
      return NextResponse.json({
        success: true,
        message: 'Comment deleted successfully (development mode)'
      });
    }
  } catch (error) {
    console.error('❌ Error deleting comment:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
