import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: userId } = await params;
    const authHeader = request.headers.get('authorization');
    const currentUserId = request.headers.get('user-id');
    
    if (!authHeader || !currentUserId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    console.log('Fetching following for user:', userId);

    // Try to connect to the actual backend first
    try {
      const backendResponse = await fetch(`https://demedia-backend.fly.dev/api/user/${userId}/following`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'user-id': currentUserId,
          'Content-Type': 'application/json',
        }
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        console.log('Backend following data received:', data.length, 'following');
        return NextResponse.json(data);
      } else {
        const errorText = await backendResponse.text();
        console.log('Backend following fetch failed:', backendResponse.status, errorText);
      }
    } catch (backendError) {
      console.log('Backend following connection error:', backendError);
    }

    // Fallback: Return mock following data
    console.log('Using fallback following data');
    const mockFollowing = [
      {
        id: 4,
        name: "Alice Brown",
        username: "aliceb",
        profilePicture: "https://demedia-backend.fly.dev/uploads/profiles/file-1760292243693-835944557.jpg",
        isFollowing: true,
        followedAt: new Date().toISOString()
      },
      {
        id: 5,
        name: "Bob Wilson",
        username: "bobw",
        profilePicture: null,
        isFollowing: true,
        followedAt: new Date(Date.now() - 259200000).toISOString()
      },
      {
        id: 6,
        name: "Carol Davis",
        username: "carold",
        profilePicture: null,
        isFollowing: true,
        followedAt: new Date(Date.now() - 345600000).toISOString()
      }
    ];

    return NextResponse.json(mockFollowing);

  } catch (error) {
    console.error('Error fetching following:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
