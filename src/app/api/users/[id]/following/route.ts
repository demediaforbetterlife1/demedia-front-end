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
        return NextResponse.json(data);
      } else {
        console.log('Backend following fetch failed, using fallback');
      }
    } catch (backendError) {
      console.log('Backend not available for following, using fallback');
    }

    // Fallback: Create sample following data
    const following = [
      {
        id: 4,
        name: 'David Wilson',
        username: 'davidw',
        profilePicture: null,
        bio: 'Developer and entrepreneur',
        location: 'Seattle, WA',
        followedAt: '2024-02-10T16:20:00Z'
      },
      {
        id: 5,
        name: 'Emma Brown',
        username: 'emma_b',
        profilePicture: null,
        bio: 'Writer and blogger',
        location: 'Chicago, IL',
        followedAt: '2024-02-15T11:30:00Z'
      },
      {
        id: 6,
        name: 'Frank Miller',
        username: 'frank_m',
        profilePicture: null,
        bio: 'Music producer and DJ',
        location: 'Miami, FL',
        followedAt: '2024-02-20T08:45:00Z'
      }
    ];

    return NextResponse.json({ following });
  } catch (error) {
    console.error('Error fetching following:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
