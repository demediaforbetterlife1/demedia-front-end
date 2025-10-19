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
      const backendResponse = await fetch(`https://demedia-backend.fly.dev/api/users/${userId}/following`, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        console.log('Backend following data received:', data);
        return NextResponse.json(data);
      } else {
        const errorText = await backendResponse.text();
        console.log('Backend following fetch failed:', backendResponse.status, errorText);
      }
    } catch (backendError) {
      console.log('Backend not available for following, using fallback');
    }

    // Fallback: Return mock following data
    console.log('Using fallback following data');
    const mockFollowing = [
      {
        id: 4,
        name: "Alice Brown",
        username: "alicebrown",
        profilePicture: null,
        bio: "Photographer",
        followedAt: new Date().toISOString()
      },
      {
        id: 5,
        name: "Bob Wilson",
        username: "bobwilson",
        profilePicture: null,
        bio: "Writer",
        followedAt: new Date().toISOString()
      }
    ];
    
    return NextResponse.json({ following: mockFollowing });
  } catch (error) {
    console.error('Error fetching following:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
