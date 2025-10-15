import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const body = await request.json();
    
    console.log('User profile update request:', { userId, body });

    // Get the authorization token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    // Try to connect to the actual backend first
    try {
      const backendResponse = await fetch(`https://demedia-backend.fly.dev/api/user/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        console.log('Backend profile update successful:', data);
        return NextResponse.json(data);
      } else {
        const errorText = await backendResponse.text();
        console.log('Backend profile update failed:', backendResponse.status, errorText);
      }
    } catch (backendError) {
      console.log('Backend not available for profile update, using fallback');
    }

    // Fallback: Return error if backend is not available
    console.log('Backend not available for profile update');
    return NextResponse.json({ 
      error: 'Backend not available',
      message: 'Profile update requires backend connection'
    }, { status: 503 });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Failed to update profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
