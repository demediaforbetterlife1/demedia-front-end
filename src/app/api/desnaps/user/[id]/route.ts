import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const viewerId = request.nextUrl.searchParams.get('viewerId');

    console.log('DeSnaps API called for user:', userId, 'viewer:', viewerId);

    // Get the authorization token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    // Try to connect to the actual backend first
    try {
      const backendResponse = await fetch(`https://demedia-backend.fly.dev/api/desnaps/user/${userId}?viewerId=${viewerId}`, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        console.log('Backend DeSnaps data received:', data);
        return NextResponse.json(data);
      } else {
        console.log('Backend DeSnaps fetch failed, using fallback');
      }
    } catch (backendError) {
      console.log('Backend not available for DeSnaps, using fallback');
    }

    // Fallback: Return empty array if backend is not available
    console.log('Backend not available for DeSnaps, returning empty array');
    return NextResponse.json([]);
  } catch (error) {
    console.error('Error fetching DeSnaps:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}