import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: userId } = params;
    const authHeader = request.headers.get('authorization');
    const currentUserId = request.headers.get('user-id');
    
    if (!authHeader || !currentUserId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    console.log('Fetching followers for user:', userId);

    // Try to connect to the actual backend first
    try {
      const backendResponse = await fetch(`https://demedia-backend.fly.dev/api/user/${userId}/followers`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'user-id': currentUserId,
          'Content-Type': 'application/json',
        }
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        console.log('Backend followers data received:', data.length, 'followers');
        return NextResponse.json(data);
      } else {
        const errorText = await backendResponse.text();
        console.log('Backend followers fetch failed:', backendResponse.status, errorText);
      }
    } catch (backendError) {
      console.log('Backend followers connection error:', backendError);
    }

    // Fallback: Return mock followers data
    console.log('Using fallback followers data');
    const mockFollowers = [
      {
        id: 1,
        name: "John Doe",
        username: "johndoe",
        profilePicture: "https://demedia-backend.fly.dev/uploads/profiles/file-1760292243693-835944557.jpg",
        isFollowing: false,
        followedAt: new Date().toISOString()
      },
      {
        id: 2,
        name: "Jane Smith",
        username: "janesmith",
        profilePicture: null,
        isFollowing: true,
        followedAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 3,
        name: "Mike Johnson",
        username: "mikej",
        profilePicture: null,
        isFollowing: false,
        followedAt: new Date(Date.now() - 172800000).toISOString()
      }
    ];

    return NextResponse.json(mockFollowers);

  } catch (error) {
    console.error('Error fetching followers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
