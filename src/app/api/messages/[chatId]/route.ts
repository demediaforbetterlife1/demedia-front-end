import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params;
    const authHeader = request.headers.get('authorization');
    const userId = request.headers.get('user-id');

    if (!authHeader || !userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.log('Fetching messages for chatId:', chatId);

    // Try to connect to the actual backend first
    try {
      const backendResponse = await fetch(`https://demedia-backend.fly.dev/api/messages/${chatId}`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'user-id': userId,
          'Content-Type': 'application/json',
        }
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        console.log('Backend messages data received:', data.length, 'messages');
        return NextResponse.json(data);
      } else {
        const errorText = await backendResponse.text();
        console.log('Backend messages fetch failed:', backendResponse.status, errorText);
      }
    } catch (backendError) {
      console.log('Backend messages connection error:', backendError);
    }

    // Fallback: Return empty messages array
    console.log('Using fallback messages data');
    return NextResponse.json([]);

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
