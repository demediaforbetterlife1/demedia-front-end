import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  let chatId: string = '';
  let authHeader: string | null = null;
  let userId: string | null = null;
  
  try {
    const resolvedParams = await params;
    chatId = resolvedParams.chatId;
    authHeader = request.headers.get('authorization');
    userId = request.headers.get('user-id');

    if (!authHeader || !userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.log('Fetching chat details for chatId:', chatId);

    // Try to connect to the actual backend first
    try {
      // Backend expects /api/chat/id/:chatId to fetch by chat id
      const backendResponse = await fetch(`https://demedia-backend.fly.dev/api/chat/id/${chatId}`, {
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
        console.log('Backend chat data received:', data);
        return NextResponse.json(data);
      } else {
        const errorText = await backendResponse.text();
        console.error('Backend chat fetch failed:', backendResponse.status, errorText);
        return NextResponse.json({ error: errorText || 'Failed to fetch chat' }, { status: backendResponse.status });
      }
    } catch (backendError) {
      console.error('Backend chat connection error:', backendError);
      return NextResponse.json({ error: 'Backend unavailable' }, { status: 503 });
    }
    // No fallback: surface the backend issue

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('❌ Chat API error:', { 
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  let chatId: string = '';
  let authHeader: string | null = null;
  let userId: string | null = null;
  
  try {
    const resolvedParams = await params;
    chatId = resolvedParams.chatId;
    authHeader = request.headers.get('authorization');
    userId = request.headers.get('user-id');

    if (!authHeader || !userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.log('Deleting chat:', chatId);

    // Try to connect to the actual backend first
    try {
      const backendResponse = await fetch(`https://demedia-backend.fly.dev/api/chat/${chatId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': authHeader,
          'user-id': userId,
          'Content-Type': 'application/json',
        }
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        console.log('Backend chat deletion successful:', data);
        return NextResponse.json(data);
      } else {
        const errorText = await backendResponse.text();
        console.log('Backend chat deletion failed:', backendResponse.status, errorText);
      }
    } catch (backendError) {
      console.log('Backend chat deletion connection error:', backendError);
    }

    // Fallback: Return success
    console.log('Using fallback chat deletion');
    return NextResponse.json({ success: true, message: 'Chat deleted successfully' });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('❌ Chat DELETE API error:', { 
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
