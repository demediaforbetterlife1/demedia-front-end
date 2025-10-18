import { NextRequest, NextResponse } from "next/server";

/**
 * User DeSnaps API - Fetches DeSnaps for a specific user
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const authHeader = request.headers.get('authorization');
    const currentUserId = request.headers.get('user-id');

    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    console.log('Fetching DeSnaps for user:', userId);

    // Try to connect to the actual backend first
    const backendUrl = process.env.BACKEND_URL || 'https://demedia-backend.fly.dev';
    
    try {
      const response = await fetch(`${backendUrl}/api/desnaps/user/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'user-id': currentUserId || '',
          'Content-Type': 'application/json',
        },
      });

      console.log('Backend DeSnaps response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Fetched user DeSnaps via backend:', data.length, 'DeSnaps');
        return NextResponse.json(data);
      } else {
        const errorText = await response.text();
        console.error('❌ Backend error:', response.status, errorText);
        // Don't throw error, continue to fallback
      }
    } catch (backendError) {
      console.error('❌ Backend connection failed:', backendError);
      // Don't throw error, continue to fallback
    }

    // Fallback: Return mock DeSnaps for development
    console.log('🔄 Using fallback: returning mock user DeSnaps');
    const mockDeSnaps = [
      {
        id: 1,
        content: "Check out my latest DeSnap! 🎬",
        thumbnail: "https://via.placeholder.com/400x300/8B5CF6/FFFFFF?text=DeSnap+1",
        duration: 30,
        visibility: 'public',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        likes: 42,
        comments: 8,
        views: 156,
        isLiked: false,
        isBookmarked: false,
        author: {
          id: parseInt(userId),
          name: "Demo User",
          username: "demouser",
          profilePicture: null
        }
      },
      {
        id: 2,
        content: "Another amazing DeSnap! ✨",
        thumbnail: "https://via.placeholder.com/400x300/EC4899/FFFFFF?text=DeSnap+2",
        duration: 45,
        visibility: 'public',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
        likes: 28,
        comments: 5,
        views: 89,
        isLiked: true,
        isBookmarked: false,
        author: {
          id: parseInt(userId),
          name: "Demo User",
          username: "demouser",
          profilePicture: null
        }
      }
    ];

    return NextResponse.json(mockDeSnaps);
  } catch (error) {
    console.error('❌ Error fetching user DeSnaps:', error);
    return NextResponse.json({ error: 'Failed to fetch user DeSnaps' }, { status: 500 });
  }
}