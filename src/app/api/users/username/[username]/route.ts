import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    console.log('Username API called for username:', username);

    // Get the authorization token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    // Try to connect to the actual backend first
    try {
      const backendResponse = await fetch(`https://demedia-backend.fly.dev/api/users/username/${username}`, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        console.log('Backend user data received for username:', username, data);
        return NextResponse.json(data);
      } else {
        console.log('Backend user fetch failed for username:', username);
      }
    } catch (backendError) {
      console.log('Backend not available for username lookup, using fallback');
    }

    // Fallback: Return 404 if backend is not available
    console.log('Backend not available for username lookup, returning 404');
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  } catch (error) {
    console.error('Error fetching user by username:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
