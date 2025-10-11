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

    // Since the backend doesn't have this endpoint, we need to create a proper implementation
    // For now, let's try to fetch from the backend directly
    try {
      const backendResponse = await fetch(`https://demedia-backend.fly.dev/api/user/${userId}/profile`, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        return NextResponse.json(data);
      }
    } catch (backendError) {
      console.log('Backend not available, using fallback data');
    }

    // Fallback: Return sample profile data until backend is implemented
    const sampleProfile = {
      id: userId,
      name: `User ${userId}`,
      username: `user${userId}`,
      bio: "This is a sample bio",
      profilePicture: null,
      coverPhoto: null,
      followersCount: Math.floor(Math.random() * 1000),
      followingCount: Math.floor(Math.random() * 500),
      postsCount: Math.floor(Math.random() * 100),
      isFollowing: false,
      isPrivate: false,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    };

    return NextResponse.json(sampleProfile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
