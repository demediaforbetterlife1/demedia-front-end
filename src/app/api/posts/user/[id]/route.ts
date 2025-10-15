import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    console.log('User posts API called for user:', userId);

    // Get the authorization token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    // Try to connect to the actual backend first
    try {
      const backendResponse = await fetch(`https://demedia-backend.fly.dev/api/posts/user/${userId}`, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        console.log('Backend user posts data received:', data);
        return NextResponse.json(data);
      } else {
        console.log('Backend user posts fetch failed, using fallback');
      }
    } catch (backendError) {
      console.log('Backend not available for user posts, using fallback');
    }

    // Fallback: Return empty array if backend is not available
    console.log('Backend not available for user posts, returning empty array');
    return NextResponse.json({ posts: [] });
  } catch (error) {
    console.error('Error fetching user posts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
