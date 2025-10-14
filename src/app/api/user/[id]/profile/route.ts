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
      // Extract user ID from token for backend
      const token = authHeader.replace('Bearer ', '');
      let currentUserId = null;
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        currentUserId = payload.sub || payload.userId || payload.id;
      } catch (e) {
        console.log('Could not extract user ID from token');
      }

      const backendResponse = await fetch(`https://demedia-backend.fly.dev/api/users/${userId}/profile`, {
        headers: {
          'Authorization': authHeader,
          'user-id': currentUserId || '',
          'Content-Type': 'application/json',
        },
      });

      console.log('Backend response status:', backendResponse.status);
      console.log('Backend response ok:', backendResponse.ok);

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        console.log('Backend profile data received:', data);
        return NextResponse.json(data);
      } else {
        const errorText = await backendResponse.text();
        console.log('Backend profile fetch failed:', backendResponse.status, errorText);
        console.log('Using fallback data');
      }
    } catch (backendError) {
      console.log('Backend not available for profile, using fallback');
    }

    // Fallback: Return sample profile data until backend is fully available
    console.log('Using fallback profile data for userId:', userId);
    const sampleProfile = {
      id: parseInt(userId),
      name: `User ${userId}`,
      username: `user${userId}`,
      bio: "This is a sample bio - Backend connection failed",
      profilePicture: null,
      coverPhoto: null,
      followersCount: Math.floor(Math.random() * 1000),
      followingCount: Math.floor(Math.random() * 500),
      likesCount: Math.floor(Math.random() * 5000),
      stories: [],
      createdAt: new Date().toISOString()
    };

    console.log('Returning fallback profile:', sampleProfile);
    return NextResponse.json(sampleProfile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
