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

      console.log('Fetching profile for userId:', userId, 'currentUserId:', currentUserId);

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
        
        // Fix profile picture URLs to use full backend URL
        if (data.profilePicture && !data.profilePicture.startsWith('http')) {
          data.profilePicture = `https://demedia-backend.fly.dev${data.profilePicture}`;
        }
        if (data.coverPhoto && !data.coverPhoto.startsWith('http')) {
          data.coverPhoto = `https://demedia-backend.fly.dev${data.coverPhoto}`;
        }
        
        return NextResponse.json(data);
      } else {
        const errorText = await backendResponse.text();
        console.log('Backend profile fetch failed:', backendResponse.status, errorText);
        
        // If it's a 404, the user doesn't exist in the backend
        if (backendResponse.status === 404) {
          console.log('User not found in backend, using fallback data');
        }
      }
    } catch (backendError) {
      console.log('Backend connection error for profile:', backendError);
    }

    // Fallback: Return sample profile data with real user data
    console.log('Using fallback profile data for userId:', userId);
    
    // Fallback: Return 404 if backend is not available
    console.log('Backend not available for profile, returning 404');
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
