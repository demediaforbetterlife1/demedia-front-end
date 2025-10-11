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

    // Since the backend doesn't have this endpoint, create sample followers data
    // This will work until the backend implements the endpoint
    const followers = [
      {
        id: 1,
        name: 'Alice Johnson',
        username: 'alice_j',
        profilePicture: null,
        bio: 'Digital creator and tech enthusiast',
        location: 'San Francisco, CA',
        followedAt: '2024-01-15T10:30:00Z'
      },
      {
        id: 2,
        name: 'Bob Smith',
        username: 'bobsmith',
        profilePicture: null,
        bio: 'Photographer and traveler',
        location: 'New York, NY',
        followedAt: '2024-01-20T14:15:00Z'
      },
      {
        id: 3,
        name: 'Carol Davis',
        username: 'carol_d',
        profilePicture: null,
        bio: 'Artist and designer',
        location: 'Los Angeles, CA',
        followedAt: '2024-02-01T09:45:00Z'
      }
    ];
    
    return NextResponse.json({ followers });
  } catch (error) {
    console.error('Error fetching followers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
