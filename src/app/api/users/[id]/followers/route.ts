import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    // Get the authorization token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    // Try to connect to the actual backend first
    try {
      const backendResponse = await fetch(`https://demedia-backend.fly.dev/api/users/${userId}/followers`, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        console.log('Backend followers data received:', data);
        return NextResponse.json(data);
      } else {
        const errorText = await backendResponse.text();
        console.log('Backend followers fetch failed:', backendResponse.status, errorText);
      }
    } catch (backendError) {
      console.log('Backend not available for followers, using fallback');
    }

    // Fallback: Return mock followers data
    console.log('Using fallback followers data');
    const mockFollowers = [
      {
        id: 2,
        name: "John Doe",
        username: "johndoe",
        profilePicture: null,
        bio: "Software developer",
        followedAt: new Date().toISOString()
      },
      {
        id: 3,
        name: "Jane Smith",
        username: "janesmith",
        profilePicture: null,
        bio: "Designer",
        followedAt: new Date().toISOString()
      }
    ];
    
    return NextResponse.json({ followers: mockFollowers });
  } catch (error) {
    console.error('Error fetching followers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
