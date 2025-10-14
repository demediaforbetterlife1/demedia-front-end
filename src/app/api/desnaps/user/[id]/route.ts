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

    console.log('Fetching DeSnaps for user:', userId);

    // Try to connect to the actual backend first
    try {
      const backendResponse = await fetch(`https://demedia-backend.fly.dev/api/desnaps/user/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'user-id': currentUserId,
          'Content-Type': 'application/json',
        }
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        console.log('Backend user DeSnaps data received:', data.length, 'desnaps');
        return NextResponse.json(data);
      } else {
        const errorText = await backendResponse.text();
        console.log('Backend user DeSnaps fetch failed:', backendResponse.status, errorText);
      }
    } catch (backendError) {
      console.log('Backend user DeSnaps connection error:', backendError);
    }

    // Fallback: Return empty array for user DeSnaps
    console.log('Using fallback user DeSnaps data');
    return NextResponse.json([]);

  } catch (error) {
    console.error('Error fetching user DeSnaps:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
