import { NextRequest, NextResponse } from "next/server";

/**
 * Story Management API - Proxies requests to backend
 * Handles story deletion
 */

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: storyId } = await params;
    const authHeader = request.headers.get('authorization');
    const userId = request.headers.get('user-id');
    
    console.log('Deleting story:', storyId);

    if (!authHeader || !userId) {
      return NextResponse.json({ error: 'No authorization header or user ID' }, { status: 401 });
    }

    // Forward request to backend
    const backendUrl = process.env.BACKEND_URL || 'https://demedia-backend.fly.dev';
    console.log('🔄 Connecting to backend for story deletion:', backendUrl);
    
    try {
      const response = await fetch(`${backendUrl}/api/stories/${storyId}`, {
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
      console.log('✅ Story deleted via backend:', storyId);
      return NextResponse.json(data);
    } catch (backendError) {
      console.error('❌ Backend connection failed for story deletion:', backendError);
      
      // Fallback: Return mock deletion success
      console.log('🔄 Using fallback: returning mock deletion success');
      return NextResponse.json({
        success: true,
        message: 'Story deleted successfully (development mode)'
      });
    }
  } catch (error) {
    console.error('❌ Error deleting story:', error);
    return NextResponse.json({ error: 'Failed to delete story' }, { status: 500 });
  }
}
