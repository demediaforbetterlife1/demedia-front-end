import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  let chatId: string = '';
  try {
    const resolvedParams = await params;
    chatId = resolvedParams.chatId;
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
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(5000)
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        console.log('Backend messages data received:', data.length, 'messages');
        return NextResponse.json(data);
      } else {
        const errorText = await backendResponse.text();
        console.log('Backend messages fetch failed:', backendResponse.status, errorText);
        // Don't throw error, continue to fallback
      }
    } catch (backendError) {
      console.log('Backend messages connection error (using fallback):', backendError);
      // Don't throw error, continue to fallback
    }

    // Fallback: Return empty messages array
    console.log('Using fallback messages data');
    return NextResponse.json([]);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('❌ Messages API error:', { 
      message: errorMessage, 
      stack: errorStack, 
      chatId,
      authHeader: !!authHeader,
      userId 
    });
    return NextResponse.json({ 
      error: 'Internal server error',
      details: errorMessage 
    }, { status: 500 });
  }
}
